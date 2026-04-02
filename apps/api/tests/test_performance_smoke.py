"""Latency smoke checks for NFR-01 non-reporting API requests."""

import math
import time


def _percentile(values: list[float], percentile: float) -> float:
    if not values:
        raise ValueError("values must not be empty")
    ordered = sorted(values)
    rank = max(0, math.ceil(percentile * len(ordered)) - 1)
    return ordered[rank]


def _measure_get_latency_ms(
    client,
    path: str,
    *,
    iterations: int = 40,
    warmup: int = 5,
) -> list[float]:
    measurements: list[float] = []
    for i in range(iterations):
        started = time.perf_counter()
        response = client.get(path)
        elapsed_ms = (time.perf_counter() - started) * 1000
        assert response.status_code == 200
        if i >= warmup:
            measurements.append(elapsed_ms)
    return measurements


def test_non_reporting_api_latency_budget(client):
    """NFR-01 baseline: p95 <= 800ms and p99 <= 1500ms for core API probes."""
    health_ms = _measure_get_latency_ms(client, "/health")
    ready_ms = _measure_get_latency_ms(client, "/ready")

    for endpoint, measurements in (("GET /health", health_ms), ("GET /ready", ready_ms)):
        p95 = _percentile(measurements, 0.95)
        p99 = _percentile(measurements, 0.99)
        assert p95 <= 800, f"{endpoint} p95 too high: {p95:.1f}ms"
        assert p99 <= 1500, f"{endpoint} p99 too high: {p99:.1f}ms"
