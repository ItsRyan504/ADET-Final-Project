import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import './Chatbot.css';

const QUICK_REPLIES = ['Menu', 'Is the store open?', 'Hours', 'Location', 'Rewards'];

function getStoreStatus() {
  const now     = new Date();
  const day     = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const isOpen  = day >= 1 && day <= 6 && minutes >= 8 * 60 && minutes < 19 * 60;

  if (isOpen) {
    const remaining = 19 * 60 - minutes;
    const hrs  = Math.floor(remaining / 60);
    const min  = remaining % 60;
    const closes = hrs > 0 ? `${hrs}h ${min}m` : `${min} minutes`;
    return { open: true, text: `Yes, we're open right now! We close in ${closes} (at 7:00 PM).` };
  }

  if (day === 0)          return { open: false, text: "We're closed today (Sunday). We open again Monday at 8:00 AM!" };
  if (now.getHours() < 8) return { open: false, text: "We're not open yet. We open at 8:00 AM today — see you soon!" };
  return { open: false, text: "We're closed for today. We reopen tomorrow at 8:00 AM!" };
}

function getResponse(input, products) {
  const text = input.toLowerCase().trim();

  /* About the store */
  if (/\b(about|tell me about|what is|who are you|what('s| is) jazsam|background|story)\b/.test(text) && /\b(store|shop|jazsam|you|this place|cafe|coffee shop)\b/.test(text)) {
    return {
      text: "Jazsam Coffee is a cozy local café in the heart of Legazpi City, Albay! ☕\n\nWe serve handcrafted Coffee, Milk Tea, and tasty Sides — made with love for every customer.\n\nWe're open Monday–Saturday, 8:00 AM – 7:00 PM, near Peñaranda Park in Old Albay District.\n\nCome visit us and experience the Jazsam difference!",
      quickReplies: QUICK_REPLIES,
    };
  }

  /* Store open — check before greeting so "hello is the store open?" works */
  if (/\b(open|closed|close)\b/.test(text) && /\b(store|shop|jazsam|you|now|today|right now)\b/.test(text)) {
    const status = getStoreStatus();
    return { text: status.text };
  }

  /* Hours */
  if (/\b(hour|opening|closing|time|schedule|when)\b/.test(text)) {
    const status = getStoreStatus();
    return {
      text: `Our hours are Monday–Saturday, 8:00 AM – 7:00 PM. Closed Sundays.\n\nRight now: ${status.text}`,
    };
  }

  /* Menu — check before greeting so "hello what's the menu" works */
  if (/\b(menu|available|what do you (have|serve|offer)|items|products)\b/.test(text)) {
    const coffees  = products.filter(p => p.category?.toLowerCase() === 'coffee');
    const milkteas = products.filter(p => /milk.?tea/i.test(p.category));
    const sides    = products.filter(p => /sides?/i.test(p.category));
    const fmt = (arr, label) => arr.length
      ? `\n${label}:\n${arr.map(p => `• ${p.name} — ₱${p.price}`).join('\n')}`
      : '';
    const body = fmt(coffees, 'Coffee') + fmt(milkteas, 'Milk Tea') + fmt(sides, 'Sides');
    return {
      text: body
        ? `Here's what we offer:${body}\n\nVisit our Menu page for sizes and customizations!`
        : "We serve Coffee, Milk Tea, and Sides! Check our Menu page for the full list.",
      link: { label: 'View Full Menu', to: '/menu' },
    };
  }

  /* Location */
  if (/\b(location|address|where|direction|map|find us)\b/.test(text)) {
    return {
      text: "We're at:\n4PLJ+32W, Old Albay District,\nLegazpi City, Albay\n\nNear Peñaranda Park!",
      link: { label: 'Get Directions', to: '/location' },
    };
  }

  /* Rewards */
  if (/\b(rewards?|point|loyalty|discount|promo)\b/.test(text)) {
    return {
      text: "We have a Rewards Program! Earn points with every purchase and redeem them for discounts.",
      link: { label: 'View Rewards', to: '/rewards' },
    };
  }

  /* Coffee */
  if (/\b(coffee|espresso|cappuccino|macchiato|mocha|latte)\b/.test(text)) {
    const items = products.filter(p => p.category?.toLowerCase() === 'coffee');
    return {
      text: items.length
        ? `Our Coffee selection:\n${items.map(p => `• ${p.name} — ₱${p.price}`).join('\n')}`
        : "We have great espresso-based drinks! Check the Menu for our coffee selection.",
      link: { label: 'Order Now', to: '/menu' },
    };
  }

  /* Milk tea */
  if (/\b(milk.?tea|taro|brown sugar|wintermelon|boba)\b/.test(text)) {
    const items = products.filter(p => /milk.?tea/i.test(p.category));
    return {
      text: items.length
        ? `Our Milk Tea selection:\n${items.map(p => `• ${p.name} — ₱${p.price}`).join('\n')}`
        : "We have a variety of milk teas! Check the Menu for our full selection.",
      link: { label: 'Order Now', to: '/menu' },
    };
  }

  /* Sides */
  if (/\b(sides?|fries|sandwich|nachos|snack|food|hungry)\b/.test(text)) {
    const items = products.filter(p => /sides?/i.test(p.category));
    return {
      text: items.length
        ? `Our Sides:\n${items.map(p => `• ${p.name} — ₱${p.price}`).join('\n')}\n\nPerfect to pair with your drink!`
        : "We have great snacks to go with your drinks! Check the Menu for our sides.",
      link: { label: 'Order Now', to: '/menu' },
    };
  }

  /* Order */
  if (/\b(order|buy|purchase|cart|checkout)\b/.test(text)) {
    return { text: "Ready to order? Head to our Menu page and add your favorites to the cart!", link: { label: 'Order Now', to: '/menu' } };
  }

  /* Price */
  if (/\b(price|how much|cost|rate)\b/.test(text)) {
    return { text: "Prices vary by item and size. Check our Menu page for full details!", link: { label: 'View Menu', to: '/menu' } };
  }

  /* Contact */
  if (/\b(contact|facebook|fb|instagram|social|follow)\b/.test(text)) {
    return { text: "Find us on:\nFacebook: Jazsam\nInstagram: @JazsamCoffee\n\nWe'd love to hear from you!" };
  }

  /* Thanks */
  if (/\b(thank|thanks|ty)\b/.test(text)) {
    return { text: "You're welcome! Anything else I can help with?", quickReplies: QUICK_REPLIES };
  }

  /* Bye */
  if (/\b(bye|goodbye|see you|take care)\b/.test(text)) {
    return { text: "Goodbye! See you at Jazsam Coffee soon! ☕" };
  }

  /* Greeting — checked last so combined messages (e.g. "hello what's the menu") hit the right handler */
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|hiya)[\s!,.]*$/i.test(text)) {
    return { text: "Hello! Welcome to Jazsam Coffee! How can I help you today?", quickReplies: QUICK_REPLIES };
  }

  /* Greeting with extra content — strip greeting, answer the rest */
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|hiya)[,!\s]+/i.test(text)) {
    const stripped = text.replace(/^(hi|hello|hey|good morning|good afternoon|good evening|hiya)[,!\s]+/i, '').trim();
    if (stripped) return getResponse(stripped, products);
  }

  return {
    text: "I'm not sure about that, but I can help with our menu, hours, location, or rewards!",
    quickReplies: QUICK_REPLIES,
  };
}

function typingDelay(responseText) {
  return Math.min(800 + responseText.length * 18, 2200);
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const INITIAL_MESSAGE = {
  id: 0,
  from: 'bot',
  text: "Hello! Welcome to Jazsam Coffee! How can I help you today?",
  quickReplies: QUICK_REPLIES,
  time: new Date(),
};

function BotText({ text }) {
  return (
    <>
      {text.split('\n').map((line, i, arr) => (
        <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
      ))}
    </>
  );
}

export default function Chatbot() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput]       = useState('');
  const [unread, setUnread]     = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);
  const navigate                = useNavigate();
  const { products }            = useStore();
  const msgIdRef                = useRef(1);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, messages]);

  function send(text) {
    if (!text.trim() || isTyping) return;
    const userMsg = { id: msgIdRef.current++, from: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const response = getResponse(text, products);
    const delay    = typingDelay(response.text);

    setTimeout(() => {
      const botMsg = { id: msgIdRef.current++, from: 'bot', ...response, time: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      if (!open) setUnread(n => n + 1);
    }, delay);
  }

  return (
    <div className="chatbot">
      <button
        className={`chatbot__fab${scrolled ? ' chatbot__fab--scrolled' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
          </svg>
        )}
        {!open && unread > 0 && <span className="chatbot__badge">{unread}</span>}
      </button>

      {open && (
        <div className="chatbot__window">
          <div className="chatbot__header">
            <div className="chatbot__header-info">
              <div className="chatbot__avatar">☕</div>
              <div>
                <div className="chatbot__name">Jazsam Assistant</div>
                <div className="chatbot__status">{isTyping ? 'typing…' : 'Online'}</div>
              </div>
            </div>
            <button className="chatbot__close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>

          <div className="chatbot__messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot__msg chatbot__msg--${msg.from}`}>
                {msg.from === 'bot' && (
                  <div className="chatbot__bot-row">
                    <div className="chatbot__msg-avatar">☕</div>
                    <div>
                      <div className="chatbot__bubble">
                        <BotText text={msg.text} />
                        {msg.link && (
                          <button
                            className="chatbot__msg-link"
                            onClick={() => { navigate(msg.link.to); setOpen(false); }}
                          >
                            {msg.link.label} →
                          </button>
                        )}
                      </div>
                      <div className="chatbot__time">{formatTime(msg.time)}</div>
                    </div>
                  </div>
                )}
                {msg.from === 'user' && (
                  <>
                    <div className="chatbot__bubble">{msg.text}</div>
                    <div className="chatbot__time">{formatTime(msg.time)}</div>
                  </>
                )}
                {msg.quickReplies && (
                  <div className="chatbot__quick-replies">
                    {msg.quickReplies.map(qr => (
                      <button key={qr} className="chatbot__qr-btn" onClick={() => send(qr)}>{qr}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="chatbot__msg chatbot__msg--bot">
                <div className="chatbot__bot-row">
                  <div className="chatbot__msg-avatar">☕</div>
                  <div className="chatbot__bubble chatbot__bubble--typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="chatbot__input-row"
            onSubmit={e => { e.preventDefault(); send(input); }}
          >
            <input
              ref={inputRef}
              className="chatbot__input"
              type="text"
              placeholder="Type a message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button className="chatbot__send" type="submit" aria-label="Send" disabled={isTyping || !input.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
