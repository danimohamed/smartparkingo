const EmptyState = ({ icon: Icon, title = 'No data found', description, action }) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            {Icon && (
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-5">
                    <Icon className="text-4xl text-gray-400 dark:text-gray-500" />
                </div>
            )}
            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</h5>
            {description && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center max-w-xs mb-4">
                    {description}
                </p>
            )}
            {action}
        </div>
    )
}

export default EmptyState
