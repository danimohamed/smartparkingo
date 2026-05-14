'use client'

import { useEffect, useRef } from 'react'
import { marked } from 'marked'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '@/components/ui/Avatar'
import useChatStore from './useChatStore'
import { PiRobotDuotone, PiUserDuotone } from 'react-icons/pi'
import {
  ParkingOptionsBlock,
  TimeSelectionBlock,
  PaymentConfirmBlock,
  GuardChatCtaBlock,
} from './ChatInteractiveBlocks'

marked.setOptions({ breaks: true, gfm: true })

const BotAvatar = () => (
  <Avatar
    size={28}
    shape="circle"
    className="bg-primary text-neutral shrink-0"
    icon={<PiRobotDuotone />}
  />
)

const UserAvatar = () => (
  <Avatar
    size={28}
    shape="circle"
    className="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200 shrink-0"
    icon={<PiUserDuotone />}
  />
)

const TextBubble = ({ msg }) => {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {isUser ? <UserAvatar /> : <BotAvatar />}
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-neutral rounded-tr-sm'
            : msg.error
              ? 'bg-error-subtle text-error border border-error/30 rounded-tl-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-sm'
        }`}
      >
        {isUser ? (
          <p className="font-semibold">{msg.content}</p>
        ) : (
          <div
            className="prose prose-sm dark:prose-invert max-w-none prose-p:my-0.5 prose-ul:my-1 prose-li:my-0"
            dangerouslySetInnerHTML={{
              __html: marked.parse(msg.content),
            }}
          />
        )}
        <p
          className={`text-[9px] mt-1 ${
            isUser ? 'text-neutral/60 text-right' : 'text-gray-400'
          }`}
        >
          {new Date(msg.timestamp).toLocaleTimeString('en-MA', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  )
}

const InteractiveBubble = ({ msg }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-2 flex-row"
    >
      <BotAvatar />
      <div className="max-w-[95%] min-w-0 flex-1">
        {msg.type === 'parkingOptions' && <ParkingOptionsBlock msg={msg} />}
        {msg.type === 'timeSelection' && <TimeSelectionBlock msg={msg} />}
        {msg.type === 'paymentConfirm' && <PaymentConfirmBlock msg={msg} />}
        {msg.type === 'guardChatCta' && <GuardChatCtaBlock msg={msg} />}
        <p className="text-[9px] mt-1 text-gray-400">
          {new Date(msg.timestamp).toLocaleTimeString('en-MA', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  )
}

const Bubble = ({ msg }) => {
  if (msg.type) {
    return <InteractiveBubble msg={msg} />
  }
  return <TextBubble msg={msg} />
}

const TypingDots = () => (
  <div className="flex gap-2 items-end">
    <BotAvatar />
    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-400"
          animate={{ y: [0, -5, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  </div>
)

export default function ChatMessages() {
  const messages = useChatStore((s) => s.messages)
  const isTyping = useChatStore((s) => s.isTyping)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-8">
          <Avatar
            size={56}
            shape="circle"
            className="bg-primary-subtle text-primary"
            icon={<PiRobotDuotone className="text-2xl" />}
          />
          <h6 className="font-bold text-gray-900 dark:text-gray-100">
            Hi! I&apos;m ParkBot
          </h6>
          <p className="text-xs text-gray-400 max-w-[220px]">
            Ask me anything about parking in Marrakech — or use quick prompts
            below.
          </p>
        </div>
      )}
      <AnimatePresence>
        {messages.map((msg) => (
          <Bubble key={msg.id} msg={msg} />
        ))}
      </AnimatePresence>
      {isTyping && <TypingDots />}
      <div ref={bottomRef} />
    </div>
  )
}
