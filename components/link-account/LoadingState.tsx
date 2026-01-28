/**
 * Loading State Component
 * Shows a spinner while checking account status
 */

interface LoadingStateProps {
    message?: string
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
    return (
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/70">{message}</p>
        </div>
    )
}
