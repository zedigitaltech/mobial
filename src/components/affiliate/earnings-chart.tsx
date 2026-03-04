"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface EarningsData {
  date: string
  earnings: number
  clicks: number
  conversions: number
}

interface EarningsChartProps {
  data: EarningsData[]
  className?: string
}

type ChartView = "earnings" | "clicks" | "conversions"

const chartConfig = {
  earnings: {
    label: "Earnings",
    color: "hsl(var(--primary))",
  },
  clicks: {
    label: "Clicks",
    color: "hsl(var(--chart-1))",
  },
  conversions: {
    label: "Conversions",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function EarningsChart({ data, className }: EarningsChartProps) {
  const [view, setView] = useState<ChartView>("earnings")

  // Sort data by date (ascending for chart)
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Format value for tooltip
  const formatValue = (value: number, key: string) => {
    if (key === "earnings") {
      return `$${value.toFixed(2)}`
    }
    return value.toString()
  }

  // Get the appropriate data key based on view
  const getDataKey = () => {
    switch (view) {
      case "earnings":
        return "earnings"
      case "clicks":
        return "clicks"
      case "conversions":
        return "conversions"
    }
  }

  // Calculate totals
  const totals = data.reduce(
    (acc, item) => ({
      earnings: acc.earnings + item.earnings,
      clicks: acc.clicks + item.clicks,
      conversions: acc.conversions + item.conversions,
    }),
    { earnings: 0, clicks: 0, conversions: 0 }
  )

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">
          {view === "earnings" && "Earnings Overview"}
          {view === "clicks" && "Clicks Overview"}
          {view === "conversions" && "Conversions Overview"}
        </CardTitle>
        <Select value={view} onValueChange={(v) => setView(v as ChartView)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="earnings">Earnings</SelectItem>
            <SelectItem value="clicks">Clicks</SelectItem>
            <SelectItem value="conversions">Conversions</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Total: </span>
            <span className="font-medium">
              {view === "earnings" && `$${totals.earnings.toFixed(2)}`}
              {view === "clicks" && totals.clicks}
              {view === "conversions" && totals.conversions}
            </span>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart
            data={sortedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillEarnings" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartConfig.earnings.color}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={chartConfig.earnings.color}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillClicks" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartConfig.clicks.color}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={chartConfig.clicks.color}
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillConversions" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartConfig.conversions.color}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={chartConfig.conversions.color}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => 
                view === "earnings" ? `$${value}` : value
              }
              className="text-xs"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => formatValue(value as number, name)}
                  labelFormatter={formatDate}
                />
              }
            />
            <Area
              type="monotone"
              dataKey={getDataKey()}
              stroke={chartConfig[getDataKey()].color}
              fill={`url(#fill${getDataKey().charAt(0).toUpperCase() + getDataKey().slice(1)})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
