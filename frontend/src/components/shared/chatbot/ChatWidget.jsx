'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import CloseButton from '@/components/ui/CloseButton'
import useChatStore from './useChatStore'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import QuickPrompts from './QuickPrompts'
import { sendToGeminiStream, parseActions, executeAction } from '@/services/GeminiService'
import {
  shouldInjectParkingPicker,
  bookingIntroMarkdownFromContext,
  matchesBookingIntent,
} from './chatBookingFlow'
import { useParkBotVoice } from './useParkBotVoice'
import {
  PiChatDotsDuotone,
  PiRobotDuotone,
  PiMicrophoneDuotone,
} from 'react-icons/pi'
import { useTranslations, useLocale } from 'next-intl'

// Map app locale (next-intl) → BCP-47 voice tag for Web Speech API.
// The chatbot answers in the user's language automatically (handled in the
// system prompt + Gemini), so we no longer expose a manual language picker.
const LOCALE_TO_VOICE = {
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-MA',
}

function resolveVoiceLang(locale) {
  if (!locale) return 'en-US'
  const base = String(locale).toLowerCase().split(/[-_]/)[0]
  return LOCALE_TO_VOICE[base] || 'en-US'
}

export default function ChatWidget() {
  const t = useTranslations('chatbot.widget')
  const locale = useLocale()
  const isOpen = useChatStore((s) => s.isOpen)
  const toggleOpen = useChatStore((s) => s.toggleOpen)
  const messages = useChatStore((s) => s.messages)
  const isTyping = useChatStore((s) => s.isTyping)
  const addMessage = useChatStore((s) => s.addMessage)
  const updateLastMessage = useChatStore((s) => s.updateLastMessage)
  const setTyping = useChatStore((s) => s.setTyping)
  const getHistory = useChatStore((s) => s.getHistory)
  const injectParkingPicker = useChatStore((s) => s.injectParkingPicker)

  const [voiceMode, setVoiceMode] = useState(false)
  const voiceLang = resolveVoiceLang(locale)

  const voiceModeRef = useRef(false)
  voiceModeRef.current = voiceMode

  const voiceModeOnAtRef = useRef(0)
  const lastSpokenIdRef = useRef(null)

  const handleSendRef = useRef(async () => {})

  const {
    speechSupported,
    listening,
    speaking,
    interim,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useParkBotVoice({
    voiceLang,
    onFinalTranscript: (t) => {
      if (voiceModeRef.current) {
        handleSendRef.current(t)
      }
    },
  })

  const handleSend = useCallback(
    async (text) => {
      const trimmed = (text || '').trim()
      if (!trimmed) return
      addMessage({ role: 'user', content: trimmed })
      setTyping(true)
      let hadActions = false
      try {
        addMessage({ role: 'assistant', content: '…' })
        const fullResponse = await sendToGeminiStream(trimmed, getHistory(), (partial) => {
          const display = partial.replace(/```action[\s\S]*$/g, '').trim() || '…'
          updateLastMessage(display)
        })

        const { cleanText, actions } = parseActions(fullResponse)
        hadActions = actions.length > 0

        const willInjectPicker =
          !hadActions &&
          shouldInjectParkingPicker(trimmed, useChatStore.getState().bookingState)

        if (actions.length > 0) {
          updateLastMessage(cleanText || t('processing'))
          for (const action of actions) {
            const result = await executeAction(action)
            addMessage({
              role: 'assistant',
              content: result.message,
              error: !result.success,
            })
          }
        } else {
          let display = cleanText || fullResponse
          if (willInjectPicker) {
            const canned = bookingIntroMarkdownFromContext()
            if (canned) display = canned
          } else if (
            matchesBookingIntent(trimmed) &&
            !bookingIntroMarkdownFromContext()
          ) {
            display = t('parkingOptionsFailed')
          }
          updateLastMessage(display)
        }

        if (willInjectPicker) {
          injectParkingPicker()
        }
      } catch (err) {
        const errMsg = err?.message || ''
        let userMsg = t('genericError')
        if (errMsg === 'RATE_LIMITED') {
          userMsg = t('rateLimited')
        } else if (errMsg === 'API_KEY_INVALID') {
          userMsg = t('apiKeyInvalid')
        } else if (errMsg === 'EMPTY_RESPONSE') {
          userMsg = t('emptyResponse')
        } else if (errMsg === 'BAD_REQUEST') {
          userMsg = t('badRequest')
        }
        updateLastMessage(userMsg)
      } finally {
        setTyping(false)
      }
    },
    [
      addMessage,
      updateLastMessage,
      setTyping,
      getHistory,
      injectParkingPicker,
      t,
    ],
  )

  handleSendRef.current = handleSend

  const toggleVoiceMode = useCallback(() => {
    setVoiceMode((v) => {
      const next = !v
      if (next) {
        voiceModeOnAtRef.current = Date.now()
        lastSpokenIdRef.current = null
        stopSpeaking()
        setTimeout(() => startListening(), 0)
      } else {
        stopListening()
        stopSpeaking()
      }
      return next
    })
  }, [startListening, stopListening, stopSpeaking])

  useEffect(() => {
    if (!voiceMode) {
      lastSpokenIdRef.current = null
    }
  }, [voiceMode])

  useEffect(() => {
    if (!voiceMode || isTyping) {
      if (voiceMode && isTyping) stopListening()
      return
    }

    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === 'assistant' && lastMsg.content === '…') {
      return
    }

    const plain = [...messages]
      .reverse()
      .find(
        (m) =>
          m.role === 'assistant' &&
          !m.type &&
          m.content &&
          m.content !== '…',
      )
    if (!plain) {
      return
    }

    if (new Date(plain.timestamp).getTime() < voiceModeOnAtRef.current) {
      return
    }

    if (lastSpokenIdRef.current === plain.id) {
      return
    }
    lastSpokenIdRef.current = plain.id

    stopListening()
    speak(plain.content).then(() => {
      if (
        voiceModeRef.current &&
        !useChatStore.getState().isTyping
      ) {
        startListening()
      }
    })
  }, [messages, isTyping, voiceMode, speak, startListening, stopListening])

  const unreadCount = messages.filter((m) => m.role === 'assistant').length

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 28,
            }}
            className="card card-border w-[calc(100vw-2rem)] sm:w-[370px] h-[calc(100dvh-6rem)] sm:h-[540px] sm:max-h-[540px] flex flex-col overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-700 bg-primary rounded-t-2xl">
              <Avatar
                size={36}
                shape="round"
                className="bg-white/20 text-neutral shrink-0"
                icon={<PiRobotDuotone className="text-lg" />}
              />
              <div className="flex-1 min-w-0">
                <h6 className="font-bold text-sm text-neutral">
                  {t('title')}
                </h6>
                <p className="text-[10px] text-neutral/70">
                  {t('subtitle')}
                </p>
              </div>


              <TooltipButton
                title={
                  speechSupported
                    ? voiceMode
                      ? t('voiceOff')
                      : t('voiceOn')
                    : t('voiceUnsupported')
                }
              >
                <Button
                  shape="circle"
                  size="xs"
                  variant={voiceMode ? 'solid' : 'plain'}
                  className={
                    voiceMode
                      ? '!bg-white/30 !text-neutral'
                      : '!text-neutral hover:!bg-white/20'
                  }
                  disabled={!speechSupported}
                  icon={<PiMicrophoneDuotone className="text-base" />}
                  onClick={toggleVoiceMode}
                />
              </TooltipButton>

              <CloseButton
                className="!bg-white/20 !text-neutral hover:!bg-white/30 shrink-0"
                onClick={toggleOpen}
              />
            </div>

            {voiceMode && (
              <div className="px-3 py-1.5 text-[10px] bg-primary-subtle text-primary border-b border-primary/20 flex items-center gap-2">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    speaking
                      ? 'bg-amber-500 animate-pulse'
                      : listening
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-gray-400'
                  }`}
                />
                {speaking
                  ? t('speaking')
                  : listening
                    ? t('listening')
                    : t('voiceReady')}
                {interim ? (
                  <span className="truncate opacity-80">{interim}</span>
                ) : null}
              </div>
            )}

            <ChatMessages />

            <QuickPrompts onSelect={handleSend} />

            <ChatInput
              onSend={handleSend}
              voiceLang={voiceLang}
              voiceMode={voiceMode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
        {unreadCount > 0 && !isOpen ? (
          <Badge content={unreadCount > 9 ? '9+' : unreadCount}>
            <Button
              shape="circle"
              size="lg"
              variant="solid"
              icon={<PiChatDotsDuotone className="text-2xl" />}
              onClick={toggleOpen}
              className="!w-14 !h-14 shadow-lg shadow-primary/30"
            />
          </Badge>
        ) : (
          <Button
            shape="circle"
            size="lg"
            variant="solid"
            icon={<PiChatDotsDuotone className="text-2xl" />}
            onClick={toggleOpen}
            className="!w-14 !h-14 shadow-lg shadow-primary/30"
          />
        )}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping bg-primary opacity-20 pointer-events-none" />
        )}
      </motion.div>
    </div>
  )
}

function TooltipButton({ title, children }) {
  return (
    <span title={title} className="inline-flex">
      {children}
    </span>
  )
}
