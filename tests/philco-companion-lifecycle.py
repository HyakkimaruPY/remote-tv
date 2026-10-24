"""Host process tests for the POSIX supervisor, using a harmless companion."""
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import unittest

SOURCE = Path(__file__).resolve().parents[1] / 'philco/bibliotecas/localhost'


class Lifecycle(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.target = self.root / 'Customer/remote-tv'
        self.target.mkdir(parents=True)
        (self.root / 'dev/shm').mkdir(parents=True)
        self.lock = self.root / 'dev/shm/remote-tv-beta651.lock'
        self.events = self.root / 'starts'
        self.env = dict(os.environ, PHILCO_ROOT=str(self.root), PHILCO_TEST_EVENTS=str(self.events))
        self.start = self.target / 'start-beta651.sh'
        shutil.copyfile(SOURCE / 'start-beta651.sh', self.start)
        self.bin = self.target / 'philco-localhost-mipsle-beta651'
        self.bin.write_text('#!' + sys.executable + '\nimport os,time\n'
                            'with open(os.environ["PHILCO_TEST_EVENTS"],"a") as f: f.write(str(os.getpid())+"\\n")\n'
                            'while True: time.sleep(1)\n')
        self.bin.chmod(0o755)
        self.processes = []

    def launch(self):
        p = subprocess.Popen(['sh', str(self.start)], env=self.env, start_new_session=True)
        self.processes.append(p)
        return p

    def until(self, fn, timeout=3):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if fn():
                return
            time.sleep(.025)
        self.fail('process lifecycle deadline exceeded')

    def pids(self):
        return [int(x) for x in self.events.read_text().split()] if self.events.exists() else []

    def running(self):
        self.until(lambda: len(self.pids()) == 1)
        return self.pids()[0]

    def gone(self, pid):
        try:
            os.kill(pid, 0)
        except ProcessLookupError:
            return True
        return False

    def tearDown(self):
        for p in self.processes:
            if p.poll() is None:
                os.killpg(p.pid, signal.SIGTERM)
                try:
                    p.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    os.killpg(p.pid, signal.SIGKILL)
                    p.wait()
        self.temp.cleanup()

    def test_term_reaps_companion_and_releases_lock(self):
        p = self.launch()
        child = self.running()
        p.terminate()
        self.assertEqual(p.wait(timeout=2), 0)
        self.until(lambda: self.gone(child))
        self.assertFalse(self.lock.exists())

    def test_duplicate_start_does_not_launch_second_companion(self):
        p = self.launch()
        self.running()
        other = self.launch()
        self.assertEqual(other.wait(timeout=2), 0)
        self.assertEqual(len(self.pids()), 1)
        self.assertEqual((self.lock / 'pid').read_text().strip(), str(p.pid))

    def test_term_interrupts_retry_delay(self):
        p = self.launch()
        child = self.running()
        os.kill(child, signal.SIGTERM)
        self.until(lambda: self.gone(child))
        p.terminate()
        self.assertEqual(p.wait(timeout=2), 0)
        self.assertFalse(self.lock.exists())
        self.assertEqual(len(self.pids()), 1)

    def test_companion_failure_retries_once_after_delay(self):
        p = self.launch()
        child = self.running()
        os.kill(child, signal.SIGTERM)
        self.until(lambda: len(self.pids()) == 2, timeout=7)
        self.assertIsNone(p.poll())
        p.terminate()
        self.assertEqual(p.wait(timeout=2), 0)
        self.until(lambda: self.gone(self.pids()[1]))
        self.assertFalse(self.lock.exists())

    def test_uninstall_stops_supervisor_without_respawn(self):
        setup = self.root / 'Customer/setup.sh'
        setup.write_text('#!/bin/sh\necho before\n# REMOTE_TV_BETA651_BEGIN\necho managed\n# REMOTE_TV_BETA651_END\necho after\n')
        p = self.launch()
        child = self.running()
        # PHILCO_ROOT isolates /proc discovery too. Signals still target the
        # real harmless processes; no host-wide process discovery is needed.
        proc = self.root / 'proc' / str(p.pid)
        proc.mkdir(parents=True)
        (proc / 'cmdline').write_bytes(b'sh\0' + os.fsencode(self.start) + b'\0')
        subprocess.run(['sh', str(SOURCE / 'uninstall-beta651.sh')], env=self.env, check=True, stdout=subprocess.DEVNULL)
        self.assertEqual(p.wait(timeout=2), 0)
        self.until(lambda: self.gone(child))
        self.assertFalse(self.bin.exists())
        self.assertFalse(self.lock.exists())
        self.assertEqual(len(self.pids()), 1)
        self.assertEqual(setup.read_text(), '#!/bin/sh\necho before\necho after\n')


if __name__ == '__main__':
    unittest.main()
