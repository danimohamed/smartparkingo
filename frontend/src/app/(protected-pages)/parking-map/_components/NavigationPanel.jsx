'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import {
    PiNavigationArrowFill,
    PiMapPinDuotone,
    PiClockDuotone,
    PiPathDuotone,
    PiCarDuotone,
    PiCheckCircleFill,
    PiArrowUpBold,
    PiArrowUpRightBold,
    PiArrowUpLeftBold,
    PiArrowRightBold,
    PiArrowLeftBold,
    PiFlagCheckeredFill,
} from 'react-icons/pi'

const maneuverIcons = {
    'turn-right': PiArrowRightBold,
    'turn-left': PiArrowLeftBold,
    'sharp right': PiArrowUpRightBold,
    'sharp left': PiArrowUpLeftBold,
    'slight right': PiArrowUpRightBold,
    'slight left': PiArrowUpLeftBold,
    'straight': PiArrowUpBold,
    'uturn': PiArrowLeftBold,
    'arrive': PiFlagCheckeredFill,
    'depart': PiNavigationArrowFill,
}

function getManeuverIcon(type, modifier) {
    if (type === 'arrive') return PiFlagCheckeredFill
    if (type === 'depart') return PiNavigationArrowFill
    return maneuverIcons[modifier] || PiArrowUpBold
}

const NavigationPanel = ({
    parking,
    distanceRemaining,
    durationRemaining,
    currentStep,
    nextStep,
    bearing,
    arrived,
    onCancel,
    speed,
    followMode,
    nightMode,
    onToggleFollow,
    onToggleNight,
}) => {
    const t = useTranslations('parkingMap.navigation')
    const StepIcon = currentStep ? getManeuverIcon(currentStep.type, currentStep.modifier) : PiNavigationArrowFill
    const NextStepIcon = nextStep ? getManeuverIcon(nextStep.type, nextStep.modifier) : null

    return (
        <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                pointerEvents: 'auto',
            }}
        >
            {/* Current instruction banner */}
            {!arrived && currentStep && (
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{
                        margin: '0 16px 8px',
                        background: 'linear-gradient(135deg, #4F46E5, #3B82F6)',
                        borderRadius: 20,
                        padding: '14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        boxShadow: '0 8px 32px rgba(79,70,229,0.35)',
                    }}
                >
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <StepIcon style={{ color: 'white', fontSize: 24 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'white', fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
                            {currentStep.instruction || t('continueOnRoute')}
                        </p>
                        {currentStep.distanceMeters > 0 && (
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
                                {currentStep.distanceMeters < 1000
                                    ? `${Math.round(currentStep.distanceMeters)} m`
                                    : `${(currentStep.distanceMeters / 1000).toFixed(1)} km`}
                            </p>
                        )}
                    </div>
                    {/* Navigation compass */}
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <PiNavigationArrowFill style={{
                            color: 'white',
                            fontSize: 20,
                            transform: `rotate(${bearing}deg)`,
                            transition: 'transform 0.5s ease',
                        }} />
                    </div>
                </motion.div>
            )}

            {/* Arrival banner */}
            <AnimatePresence>
                {arrived && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            margin: '0 16px 8px',
                            background: 'linear-gradient(135deg, #10B981, #059669)',
                            borderRadius: 20,
                            padding: '20px',
                            textAlign: 'center',
                            boxShadow: '0 8px 32px rgba(16,185,129,0.35)',
                        }}
                    >
                        <PiCheckCircleFill style={{ color: 'white', fontSize: 40, margin: '0 auto 8px' }} />
                        <p style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>{t('arrived')}</p>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>{parking?.name}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main bottom panel */}
            <div style={{
                background: 'white',
                borderRadius: '24px 24px 0 0',
                boxShadow: '0 -4px 32px rgba(0,0,0,0.1)',
                overflow: 'hidden',
            }}>
                {/* Handle bar */}
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
                    <div style={{ width: 40, height: 4, borderRadius: 4, background: '#e5e7eb' }} />
                </div>

                {/* Parking info + stats */}
                <div style={{ padding: '8px 20px 16px' }}>
                    {/* Parking name row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                background: arrived ? '#ECFDF5' : '#EEF2FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                {arrived
                                    ? <PiCheckCircleFill style={{ color: '#10B981', fontSize: 22 }} />
                                    : <PiCarDuotone style={{ color: '#4F46E5', fontSize: 22 }} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontWeight: 700, fontSize: 16, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {parking?.name || 'Parking'}
                                </p>
                                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
                                    {parking?.address || ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                        <div style={{
                            background: '#F9FAFB',
                            borderRadius: 16,
                            padding: '12px 6px',
                            textAlign: 'center',
                        }}>
                            <PiPathDuotone style={{ color: '#3B82F6', fontSize: 20, margin: '0 auto 4px' }} />
                            <p style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('distance')}</p>
                            <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginTop: 2 }}>
                                {distanceRemaining || '--'}
                            </p>
                        </div>
                        <div style={{
                            background: '#F9FAFB',
                            borderRadius: 16,
                            padding: '12px 6px',
                            textAlign: 'center',
                        }}>
                            <PiClockDuotone style={{ color: '#F59E0B', fontSize: 20, margin: '0 auto 4px' }} />
                            <p style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('eta')}</p>
                            <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginTop: 2 }}>
                                {durationRemaining || '--'}
                            </p>
                        </div>
                        <div style={{
                            background: '#F9FAFB',
                            borderRadius: 16,
                            padding: '12px 6px',
                            textAlign: 'center',
                        }}>
                            <PiCarDuotone style={{ color: '#6366F1', fontSize: 20, margin: '0 auto 4px' }} />
                            <p style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('speed')}</p>
                            <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginTop: 2 }}>
                                {speed || 0} <span style={{ fontSize: 10, fontWeight: 500 }}>km/h</span>
                            </p>
                        </div>
                        <div style={{
                            background: '#F9FAFB',
                            borderRadius: 16,
                            padding: '12px 6px',
                            textAlign: 'center',
                        }}>
                            <PiMapPinDuotone style={{ color: '#10B981', fontSize: 20, margin: '0 auto 4px' }} />
                            <p style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('slots')}</p>
                            <p style={{ fontWeight: 700, fontSize: 14, color: '#10B981', marginTop: 2 }}>
                                {parking?.availableSlots || 0}
                            </p>
                        </div>
                    </div>

                    {/* Follow & Night mode toggles */}
                    {!arrived && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                            <button
                                onClick={onToggleFollow}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: 14,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    background: followMode ? '#EEF2FF' : '#F9FAFB',
                                    color: followMode ? '#4F46E5' : '#9CA3AF',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <PiNavigationArrowFill style={{ fontSize: 14 }} />
                                {followMode ? t('following') : t('follow')}
                            </button>
                            <button
                                onClick={onToggleNight}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: 14,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    background: nightMode ? '#1E1B4B' : '#F9FAFB',
                                    color: nightMode ? '#C7D2FE' : '#9CA3AF',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {nightMode ? t('night') : t('day')}
                            </button>
                        </div>
                    )}

                    {/* Next step preview */}
                    {!arrived && nextStep && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            background: '#F9FAFB',
                            borderRadius: 14,
                            marginBottom: 14,
                        }}>
                            {NextStepIcon && <NextStepIcon style={{ color: '#6B7280', fontSize: 16, flexShrink: 0 }} />}
                            <p style={{ fontSize: 12, color: '#6B7280', flex: 1 }}>
                                {t('then', { instruction: nextStep.instruction || t('continue') })}
                            </p>
                        </div>
                    )}

                    {/* Cancel / End navigation */}
                    <button
                        onClick={onCancel}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: 16,
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: 14,
                            transition: 'all 0.2s',
                            background: arrived ? 'linear-gradient(135deg, #10B981, #059669)' : '#FEE2E2',
                            color: arrived ? 'white' : '#EF4444',
                        }}
                    >
                        {arrived ? t('doneViewParking') : t('cancel')}
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

export default NavigationPanel


