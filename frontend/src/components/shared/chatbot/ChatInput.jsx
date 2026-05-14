'use client'

import { useState, useRef, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Tooltip from '@/components/ui/Tooltip'
import {
  PiPaperPlaneTiltFill,
  PiArrowCounterClockwiseBold,
  PiMicrophoneDuotone,
} from 'react-icons/pi'
import useChatStore from './useChatStore'
import { useSpeechDictation } from './useParkBotVoice'
import { useTranslations } from 'next-intl'

export default function ChatInput({
  onSend,
  voiceLang = 'en-US',
  voiceMode = false,
}) {
  const t = useTranslations('chatbot.input')
  const [value, setValue] = useState('')
  const isTyping = useChatStore((s) => s.isTyping)
  const clearChat = useChatStore((s) => s.clearChat)
  const inputRef = useRef(null)

  const {
    speechSupported: dictationSupported,
    listening: dictationListening,
    interim: dictationInterim,
    start: startDictation,
    stop: stopDictation,
  } = useSpeechDictation({
    voiceLang,
    onFinal: (t) => {
      setValue((v) => {
        const sep = v && !v.endsWith(' ') ? ' ' : ''
        return `${v}${sep}${t}`
      })
      setTimeout(() => inputRef.current?.focus(), 50)
    },
  })

  useEffect(() => {
    if (voiceMode) stopDictation()
  }, [voiceMode, stopDictation])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isTyping) return
    setValue('')
    onSend(trimmed)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleMic = () => {
    if (!dictationSupported || voiceMode || isTyping) return
    if (dictationListening) stopDictation()
    else startDictation()
  }

  const micActive = dictationListening
  const showMic = dictationSupported && !voiceMode

  return (
    <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 items-end">
      <Tooltip title={t('clearChat')}>
        <Button
          shape="circle"
          size="sm"
          variant="plain"
          icon={<PiArrowCounterClockwiseBold />}
          onClick={clearChat}
        />
      </Tooltip>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={
            voiceMode
              ? t('speakOrType')
              : t('askParking')
          }
          disabled={isTyping}
          className="input input-md flex-1 resize-none !rounded-xl max-h-28 overflow-auto"
        />
        {dictationInterim ? (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 px-1 truncate">
            {dictationInterim}
          </p>
        ) : null}
      </div>
      {showMic && (
        <Tooltip title={micActive ? t('stopDictation') : t('dictate')}>
          <Button
            shape="circle"
            size="sm"
            variant={micActive ? 'solid' : 'plain'}
            className={micActive ? '!text-neutral' : ''}
            icon={<PiMicrophoneDuotone />}
            onClick={toggleMic}
            disabled={isTyping}
          />
        </Tooltip>
      )}
      <Button
        shape="circle"
        size="sm"
        variant="solid"
        icon={<PiPaperPlaneTiltFill />}
        onClick={handleSend}
        disabled={!value.trim() || isTyping}
      />
    </div>
  )
}
