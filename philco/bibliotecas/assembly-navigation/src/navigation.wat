;; Philco 6.4.1 focus/state helper — WebAssembly Text (Assembly).
;; Pure deterministic i32 operations. No imports, no access to MStar firmware.
(module
  (func (export "next_focus") (param $index i32) (param $delta i32) (param $count i32) (result i32)
    local.get $count
    i32.const 0
    i32.le_s
    if (result i32)
      i32.const -1
    else
      local.get $index
      local.get $delta
      i32.add
      local.get $count
      i32.add
      local.get $count
      i32.rem_s
    end)
  (func (export "accept_key") (param $now i32) (param $last i32) (param $interval i32) (result i32)
    local.get $now
    local.get $last
    i32.sub
    local.get $interval
    i32.ge_u)
  (func (export "needs_restart") (param $requested i32) (param $running i32) (param $requires i32) (result i32)
    local.get $requested
    local.get $running
    i32.ne
    local.get $requires
    i32.const 0
    i32.ne
    i32.and)
)
