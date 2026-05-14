import Skeleton from '@/components/ui/Skeleton'

const CardSkeleton = ({ count = 3 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Skeleton variant="circle" width={40} height={40} />
                        <div className="flex-1">
                            <Skeleton width="60%" height={14} className="mb-2" />
                            <Skeleton width="40%" height={10} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Skeleton height={12} />
                        <Skeleton height={12} width="80%" />
                        <Skeleton height={12} width="50%" />
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <Skeleton width={80} height={24} />
                        <Skeleton width={60} height={28} />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default CardSkeleton
