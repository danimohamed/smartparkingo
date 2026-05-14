import { cloneElement } from 'react'
import AuthSideVideoPanel from './AuthSideVideoPanel'

/** Served from /public/video (Turbopack cannot import .mp4 from src as a module). */
const AUTH_SIDE_VIDEO_SRC = '/video/auth-side-park.mp4'

const Side = ({ children, ...rest }) => {
    return (
        <div className="min-h-[100dvh] w-full bg-white dark:bg-gray-800">
            <div className="mx-auto grid min-h-[100dvh] w-full max-w-7xl grid-cols-1 gap-0 p-4 sm:p-6 lg:grid-cols-2 lg:gap-10">
                <div className="flex flex-col justify-center">
                    <div className="w-full max-w-[420px] xl:max-w-[480px] px-2 sm:px-6 lg:px-0">
                    {children
                        ? cloneElement(children, {
                              ...rest,
                          })
                        : null}
                    </div>
                </div>
                <div className="hidden lg:flex min-h-0 flex-col justify-center">
                    <div className="relative h-[min(72vh,720px)] w-full rounded-3xl">
                        <AuthSideVideoPanel src={AUTH_SIDE_VIDEO_SRC} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Side
