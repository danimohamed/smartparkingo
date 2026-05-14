'use client'
import Card from '@/components/ui/Card'
import Chart from '@/components/shared/Chart'

const ChartCard = ({ title, subtitle, children, type, series, xAxis, height = 280, customOptions }) => {
    return (
        <Card>
            <div className="mb-2">
                <h6 className="font-bold text-gray-900 dark:text-white">{title}</h6>
                {subtitle && (
                    <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
                )}
            </div>
            {children || (
                <Chart
                    type={type}
                    series={series}
                    xAxis={xAxis}
                    height={height}
                    customOptions={customOptions}
                />
            )}
        </Card>
    )
}

export default ChartCard
