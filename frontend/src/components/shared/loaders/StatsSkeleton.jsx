import Skeleton from '@/components/ui/Skeleton'

const StatsSkeleton = ({ count = 4 }) => {
    return (
        <div className={`grid grid-cols-2 md:grid-cols-${count} gap-4`}>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
                >
                    <div className="flex items-center gap-3">
                        <Skeleton variant="circle" width={44} height={44} />
                        <div className="flex-1">
                            <Skeleton width="50%" height={10} className="mb-2" />
                            <Skeleton width="30%" height={20} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default StatsSkeleton
