/* Philco Beta 6.4 diagnostic WebAssembly core. No memory allocation or syscalls. */
__attribute__((export_name("classify"))) int classify(int http_status, int latency_ms) {
    if (http_status < 200 || http_status >= 400) return 0;
    if (latency_ms < 0 || latency_ms > 3000) return 1;
    return 2;
}
__attribute__((export_name("quality"))) int quality(int stalls, int errors, int delay_ms) {
    if (stalls < 0 || errors < 0 || delay_ms < 0) return 0;
    if (errors > 0 || stalls > 4 || delay_ms > 8000) return 1;
    return 2;
}
