"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, ColorType, CrosshairMode, LineStyle, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import type { IChartApi, ISeriesApi, CandlestickData, Time } from "lightweight-charts";

interface Props {
  mint: string;
  symbol: string;
  spotPrice?: number;
  priceChange24h?: number;
  targetPrice?: number | null;
}

interface CandleBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export default function PriceChart({ mint, symbol, spotPrice, priceChange24h, targetPrice }: Props) {
  const displayPrice = spotPrice ?? 0;
  const displayChange = priceChange24h ?? 0;
  const isUp = displayChange >= 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const targetLineRef = useRef<ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("15m");

  const isDark = typeof document !== "undefined"
    ? !document.documentElement.classList.contains("light")
    : true;

  const fetchCandles = useCallback(async (tf: string): Promise<CandleBar[]> => {
    try {
      const res = await fetch(`/api/ohlcv?mint=${mint}&tf=${tf}`);
      if (!res.ok) throw new Error("OHLCV fetch failed");
      const bars: CandleBar[] = await res.json();
      if (!Array.isArray(bars) || bars.length === 0) throw new Error("No data");
      return bars;
    } catch {
      return generateFallbackData(displayPrice, tf);
    }
  }, [mint, displayPrice]);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const bgColor = isDark ? "#0C0F10" : "#FFFFFF";
    const textColor = isDark ? "#646C6F" : "#999";
    const gridColor = isDark ? "#1A1F20" : "#E5E5E5";

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: bgColor },
        textColor,
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: gridColor,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: true,
        secondsVisible: false,
        shiftVisibleRangeOnNewBar: true,
      },
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#37D48F",
      downColor: "#FF4B4B",
      borderDownColor: "#FF4B4B",
      borderUpColor: "#37D48F",
      wickDownColor: "#FF4B4B",
      wickUpColor: "#37D48F",
    });

    // Volume histogram on a separate pane
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#49E7B233",
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRef.current = series;
    volumeRef.current = volumeSeries;

    // Load data
    fetchCandles(timeframe).then((data) => {
      if (data.length > 0) {
        const candleData = data.map(({ time, open, high, low, close }) => ({ time, open, high, low, close }));
        series.setData(candleData as unknown as CandlestickData<Time>[]);
        // Set volume data
        const volData = data
          .filter((d) => d.volume != null && d.volume! > 0)
          .map((d) => ({
            time: d.time as Time,
            value: d.volume!,
            color: d.close >= d.open ? "#37D48F33" : "#FF4B4B33",
          }));
        if (volData.length > 0) volumeSeries.setData(volData);
        zoomToDefault(chart, timeframe);
      }
      setLoading(false);
    });

    // Resize handler
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeRef.current = null;
      targetLineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mint, isDark]);

  // Update target price line
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    // Remove old line
    if (targetLineRef.current) {
      series.removePriceLine(targetLineRef.current);
      targetLineRef.current = null;
    }

    // Add new line
    if (targetPrice != null && targetPrice > 0) {
      targetLineRef.current = series.createPriceLine({
        price: targetPrice,
        color: "#E7B849",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `Limit: $${formatPrice(targetPrice)}`,
        axisLabelColor: "#E7B849",
        axisLabelTextColor: "#0C0F10",
      });
    }
  }, [targetPrice]);

  // Timeframe change
  function handleTimeframe(tf: string) {
    setTimeframe(tf);
    setLoading(true);
    fetchCandles(tf).then((data) => {
      if (seriesRef.current && data.length > 0) {
        const candleData = data.map(({ time, open, high, low, close }) => ({ time, open, high, low, close }));
        seriesRef.current.setData(candleData as unknown as CandlestickData<Time>[]);
        if (volumeRef.current) {
          const volData = data
            .filter((d) => d.volume != null && d.volume! > 0)
            .map((d) => ({
              time: d.time as Time,
              value: d.volume!,
              color: d.close >= d.open ? "#37D48F33" : "#FF4B4B33",
            }));
          if (volData.length > 0) volumeRef.current.setData(volData);
        }
        if (chartRef.current) zoomToDefault(chartRef.current, tf);
      }
      setLoading(false);
    });
  }

  return (
    <div className="glass-card overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 md:px-4 pt-3 pb-2 flex-wrap gap-2">
        <div className="flex items-baseline gap-2 md:gap-3">
          <span className="text-sm font-medium text-text-secondary">${symbol} / USDC</span>
          {displayPrice > 0 && (
            <>
              <span className="text-xl font-bold font-mono text-text-primary">
                ${formatPrice(displayPrice)}
              </span>
              <span className={`text-base font-mono ${isUp ? "text-green" : "text-red"}`}>
                {isUp ? "+" : ""}{displayChange.toFixed(2)}%
              </span>
            </>
          )}
        </div>
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full bg-mint/10 border border-mint/20">
          <div className="w-1 h-1 rounded-full bg-mint animate-pulse" />
          <span className="text-sm font-medium text-mint">Earning yield while waiting</span>
        </div>
      </div>

      {/* Timeframe buttons + reset */}
      <div className="flex items-center gap-0.5 md:gap-1 px-2 md:px-4 pb-2">
        {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
          <button
            key={tf}
            onClick={() => handleTimeframe(tf)}
            className={`px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs font-medium transition-all ${
              timeframe === tf
                ? "bg-mint text-bg-base"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {tf}
          </button>
        ))}
        <button
          onClick={() => chartRef.current && zoomToDefault(chartRef.current, timeframe)}
          className="ml-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs font-medium text-text-dim hover:text-text-primary transition-colors"
          title="Reset zoom"
        >
          ↺
        </button>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[280px] md:min-h-[400px] relative">
        <div ref={containerRef} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-card/50">
            <div className="w-5 h-5 border-2 border-mint/30 border-t-mint rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Zoom the chart to show a sensible default window per timeframe */
function zoomToDefault(chart: IChartApi, tf: string) {
  // How many seconds of data to show initially
  const visibleSeconds: Record<string, number> = {
    "1m": 3600 * 2,        // 2 hours
    "5m": 3600 * 8,        // 8 hours
    "15m": 3600 * 48,      // 2 days
    "1h": 3600 * 24 * 7,   // 1 week
    "4h": 3600 * 24 * 21,  // 3 weeks
    "1d": 3600 * 24 * 90,  // 3 months
  };
  const window = visibleSeconds[tf] ?? 3600 * 4;
  const now = Math.floor(Date.now() / 1000);
  chart.timeScale().setVisibleRange({
    from: (now - window) as Time,
    to: (now + 300) as Time, // small padding to the right
  });
}

function generateFallbackData(spotPrice: number, tf: string): CandleBar[] {
  if (spotPrice <= 0) return [];
  const now = Math.floor(Date.now() / 1000);
  const intervals: Record<string, number> = {
    "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400,
  };
  const interval = intervals[tf] ?? 900;
  const bars: CandleBar[] = [];
  let price = spotPrice * 0.97;

  for (let i = 100; i >= 0; i--) {
    const time = now - i * interval;
    const change = (Math.random() - 0.48) * spotPrice * 0.005;
    const open = price;
    price = price + change;
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.003);
    const low = Math.min(open, close) * (1 - Math.random() * 0.003);
    bars.push({ time, open, high, low, close });
  }
  if (bars.length > 0) {
    bars[bars.length - 1].close = spotPrice;
    bars[bars.length - 1].high = Math.max(bars[bars.length - 1].high, spotPrice);
  }
  return bars;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(0);
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}
