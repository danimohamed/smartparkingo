import classNames from 'classnames'
import { APP_NAME } from '@/constants/app.constant'
import Image from 'next/image'

import logoFull from '@/image/3.png'
import logoMini from '@/image/2.png'

const Logo = (props) => {
    const {
        type = 'full',
        className,
        imgClass,
        style,
        logoWidth,
        logoHeight,
    } = props

    const width = logoWidth || (type === 'full' ? 200 : 48)
    const height = logoHeight || (type === 'full' ? 70 : 48)
    const src = type === 'streamline' ? logoMini : logoFull

    return (
        <div className={classNames('logo', className)} style={style}>
            <Image
                className={classNames('object-contain', imgClass)}
                src={src}
                alt={`${APP_NAME} logo`}
                width={width}
                height={height}
                quality={100}
                priority
            />
        </div>
    )
}

export default Logo
