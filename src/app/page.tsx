'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

export default function HomePage() {
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how' },
    { label: 'About', href: '#about' },
  ]

  const sidebarItems = [
    ['Library', '124'],
    ['Inbox', '8'],
    ['Recent', '13'],
    ['Connections', '24'],
    ['Shared', '5'],
  ]

  const spaces = ['Design', 'Writing', 'Ideas', 'Travel', 'Work', 'Personal']

  const features = [
    {
      icon: '↗',
      title: 'Save anything',
      text: 'Links, notes, images, videos and files all live in one place.',
    },
    {
      icon: '✎',
      title: 'Add context',
      text: 'Write thoughts and notes so your saved things stay meaningful.',
    },
    {
      icon: '⌘',
      title: 'Organize gently',
      text: 'Use folders and spaces without turning everything into work.',
    },
    {
      icon: '⌕',
      title: 'Find it again',
      text: 'Search and rediscover what mattered when you saved it.',
    },
  ]

  const steps = [
    {
      number: '01',
      title: 'Capture',
      text: 'Drop in a link, note, image, file or video.',
    },
    {
      number: '02',
      title: 'Organize',
      text: 'Put it into a space when it feels natural.',
    },
    {
      number: '03',
      title: 'Return',
      text: 'Find it again when the moment is right.',
    },
  ]

  return (
    <main
      className="
        min-h-screen
        text-[#171A17]
        dark:text-[#F3F0E9]
        transition-colors duration-500
        animate-smooth-gradient
      "
    >
      {/* 
        This embedded style handles the smooth moving gradient background 
        using the exact brand colors for both Light and Dark themes.
      */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes smooth-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-smooth-gradient {
          background-size: 200% 200%;
          animation: smooth-gradient 12s ease infinite;
          background-image: linear-gradient(-45deg, #F5F1E8, #E2E8DE, #F8F5EE, #DDE6DB);
        }
        .dark .animate-smooth-gradient {
          background-image: linear-gradient(-45deg, #0F120F, #1A221A, #0A0C0A, #141A14);
        }
      `}} />

      {/* NAVBAR */}
      <header className="relative z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
          <Link
            href="/"
            className="
              text-2xl font-semibold tracking-tight
              text-[#171A17]
              transition-opacity duration-300
              hover:opacity-70
              dark:text-[#F4F1EA]
              sm:text-3xl
            "
          >
            inntoit
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden items-center gap-8 text-sm md:flex">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="
                  text-[#636A63]
                  transition-all duration-300
                  hover:-translate-y-[1px]
                  hover:text-[#171A17]
                  dark:text-[#9DA59D]
                  dark:hover:text-white
                "
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* THEME TOGGLE */}
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className="
                flex h-10 w-10 items-center justify-center
                rounded-xl
                border border-[#D7D0C4]
                bg-white
                text-[#303630]
                transition-all duration-300
                hover:-translate-y-0.5
                hover:shadow-md
                dark:border-[#343A34]
                dark:bg-[#191D19]
                dark:text-[#EDE9E0]
                dark:hover:bg-[#202520]
              "
            >
              {isDarkMode ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>

            {/* DESKTOP ACTIONS: Single Login Call-to-Action */}
            <Link
              href="/login"
              className="
                hidden
                rounded-xl
                bg-[#4D6A51]
                px-4 py-2.5
                text-sm font-medium text-white
                transition-all duration-300
                hover:-translate-y-0.5
                hover:shadow-lg
                dark:bg-[#69866E]
                sm:inline-flex
              "
            >
              Start collecting
            </Link>

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Open navigation menu"
              className="
                flex h-10 w-10 items-center justify-center
                rounded-xl
                border border-[#D7D0C4]
                bg-white
                text-[#303630]
                transition-all duration-300
                dark:border-[#343A34]
                dark:bg-[#191D19]
                dark:text-[#EDE9E0]
                md:hidden
              "
            >
              {mobileMenuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 6L6 18M6 6l12 12" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
              )}
            </button>
          </div>
        </nav>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="mx-4 mb-4 rounded-2xl border border-[#DED7CC] bg-[#FBF9F4] p-4 shadow-lg dark:border-[#2A302A] dark:bg-[#151815] md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="
                    rounded-xl
                    px-4 py-3
                    text-sm
                    text-[#596159]
                    transition-colors
                    hover:bg-[#F0ECE5]
                    dark:text-[#AEB5AE]
                    dark:hover:bg-[#202520]
                  "
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="mt-4 grid gap-3 border-t border-[#E6DED4] pt-4 dark:border-[#292E29]">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="
                  w-full block text-center
                  rounded-xl
                  bg-[#4D6A51]
                  px-4 py-3
                  text-sm font-medium text-white
                  transition-all
                  dark:bg-[#69866E]
                "
              >
                Start collecting
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-10">
        <div
          className="
            relative overflow-hidden
            rounded-[26px]
            border border-[#E3DDD2]
            bg-[#FBF9F4]
            px-5 py-16
            text-center
            shadow-[0_20px_60px_rgba(0,0,0,0.04)]
            transition-all duration-500
            dark:border-[#292E29]
            dark:bg-[#151815]
            dark:shadow-[0_25px_70px_rgba(0,0,0,0.28)]
            sm:rounded-[32px]
            sm:px-8
            sm:py-20
            md:px-12
            md:py-24
            lg:rounded-[36px]
            lg:py-28
          "
        >
          <div
            className="absolute inset-0 opacity-40 dark:opacity-[0.12]"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(130,130,120,0.24) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />

          <div className="relative z-10">
            <p className="mb-5 text-[10px] uppercase tracking-[0.28em] text-[#737B73] dark:text-[#8F998F] sm:text-xs sm:tracking-[0.35em]">
              A calmer place for the internet
            </p>

            <h1
              className="
                mx-auto max-w-4xl
                text-[2.75rem]
                font-semibold
                leading-[0.98]
                tracking-tight
                sm:text-5xl
                md:text-6xl
                lg:text-7xl
              "
            >
              Everything you’re into,
              <br className="hidden sm:block" />
              <span className="sm:ml-2">kept together.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#666D66] dark:text-[#AEB5AE] sm:mt-7 sm:text-lg sm:leading-8 md:text-xl">
              Save links, notes, ideas, images, videos and files. Organize them
              gently, connect what matters, and come back whenever you need it.
            </p>

            <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:mt-9 sm:max-w-none sm:flex-row sm:justify-center">
              <Link
                href="/login"
                className="
                  group inline-flex w-full items-center justify-center gap-3
                  rounded-2xl
                  bg-[#4D6A51]
                  px-6 py-3.5
                  text-sm font-medium text-white
                  shadow-[0_8px_20px_rgba(77,106,81,0.18)]
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:shadow-[0_14px_28px_rgba(77,106,81,0.25)]
                  dark:bg-[#69866E]
                  sm:w-auto
                "
              >
                Start collecting
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <a
                href="#how"
                className="
                  inline-flex w-full items-center justify-center
                  rounded-2xl
                  border border-[#D9D2C7]
                  bg-white
                  px-6 py-3.5
                  text-sm font-medium
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:shadow-md
                  dark:border-[#343A34]
                  dark:bg-[#191D19]
                  dark:text-[#F1EEE7]
                  dark:hover:bg-[#202520]
                  sm:w-auto
                "
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT PREVIEW */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div
          className="
            rounded-[24px]
            border border-[#E4DDD2]
            bg-[#FAF8F3]
            p-2.5
            shadow-[0_25px_70px_rgba(0,0,0,0.05)]
            transition-all duration-700
            hover:shadow-[0_35px_90px_rgba(48,60,48,0.10)]
            dark:border-[#282D28]
            dark:bg-[#131613]
            dark:hover:shadow-[0_35px_90px_rgba(0,0,0,0.32)]
            sm:rounded-[30px]
            sm:p-4
            md:p-6
          "
        >
          <div className="overflow-hidden rounded-[20px] border border-[#E8E1D7] bg-white transition-colors duration-500 dark:border-[#292E29] dark:bg-[#151815] sm:rounded-[24px]">
            {/* WINDOW BAR */}
            <div className="flex items-center gap-2 border-b border-[#ECE5DB] px-4 py-3 dark:border-[#292E29]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F19A8A] sm:h-3 sm:w-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#F2C669] sm:h-3 sm:w-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#7EC47E] sm:h-3 sm:w-3" />
            </div>

            <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr]">
              {/* SIDEBAR */}
              <aside
                className="
                  border-b border-[#ECE5DB]
                  bg-[#FBFAF7]
                  p-4
                  transition-colors duration-500
                  dark:border-[#292E29]
                  dark:bg-[#121512]
                  md:border-b-0
                  md:border-r
                  md:p-5
                "
              >
                <div className="mb-5 text-2xl font-semibold sm:text-3xl md:mb-8">
                  inntoit
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:block md:space-y-2">
                  {sidebarItems.map(([label, count], index) => (
                    <div
                      key={label}
                      className={`
                        flex items-center justify-between
                        rounded-xl
                        px-3 py-2.5
                        text-xs
                        transition-colors duration-300
                        sm:text-sm
                        ${
                          index === 0
                            ? 'bg-[#EDF1E8] text-[#1B221B] dark:bg-[#202820] dark:text-[#ECF0EA]'
                            : 'text-[#626A62] hover:bg-[#F2EFE8] dark:text-[#A0A8A0] dark:hover:bg-[#1A1E1A]'
                        }
                      `}
                    >
                      <span>{label}</span>
                      <span className="ml-2 text-[10px] sm:text-xs">{count}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 hidden md:block">
                  <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#929992]">
                    Spaces
                  </p>

                  <div className="space-y-2 text-sm text-[#636A63] dark:text-[#9CA49C]">
                    {spaces.map((item) => (
                      <div
                        key={item}
                        className="
                          rounded-xl
                          px-3 py-2
                          transition-all duration-300
                          hover:bg-[#F1EEE7]
                          hover:pl-4
                          dark:hover:bg-[#1B201B]
                        "
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 hidden rounded-2xl border border-[#E6DED3] bg-white p-4 transition-colors duration-500 dark:border-[#2B302B] dark:bg-[#181C18] md:block">
                  <p className="text-sm leading-6 text-[#697069] dark:text-[#A8B0A8]">
                    Collect. Reflect.
                    <br />
                    Return to what matters.
                  </p>
                </div>
              </aside>

              {/* MAIN PREVIEW */}
              <div className="p-4 sm:p-5 md:p-6 lg:p-7">
                <div className="mb-5 flex flex-col gap-3 lg:flex-row">
                  <div
                    className="
                      flex-1
                      rounded-2xl
                      border border-[#E9E3D9]
                      bg-[#F8F6F1]
                      px-4 py-3
                      text-sm text-[#A0A6A0]
                      transition-all duration-300
                      hover:border-[#C9D2C7]
                      dark:border-[#2A302A]
                      dark:bg-[#191D19]
                      dark:text-[#7E877E]
                    "
                  >
                    Search your library...
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['All', 'Links', 'Notes', 'Images', 'Videos'].map(
                      (item, index) => (
                        <span
                          key={item}
                          className={`
                            rounded-full
                            px-3 py-1.5
                            text-xs
                            transition-all duration-300
                            hover:-translate-y-0.5
                            ${
                              index === 0
                                ? 'bg-[#4D6A51] text-white dark:bg-[#69866E]'
                                : 'bg-[#F0ECE5] text-[#606960] hover:bg-[#E8E4DC] dark:bg-[#202420] dark:text-[#A9B0A9] dark:hover:bg-[#282D28]'
                            }
                          `}
                        >
                          {item}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="mb-5 sm:mb-6">
                  <h2 className="text-2xl font-semibold sm:text-3xl">
                    Your library
                  </h2>

                  <p className="mt-1 text-sm text-[#747C74] dark:text-[#959D95]">
                    124 saved things
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {/* LINK CARD */}
                  <div
                    className="
                      group overflow-hidden
                      rounded-2xl
                      border border-[#E9E2D8]
                      bg-white
                      transition-all duration-500
                      hover:-translate-y-1.5
                      hover:shadow-[0_18px_40px_rgba(42,50,42,0.10)]
                      dark:border-[#2A302A]
                      dark:bg-[#181C18]
                    "
                  >
                    <div className="overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
                        alt="Coastal landscape"
                        className="h-44 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                      />
                    </div>

                    <div className="p-4">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#56715A] dark:text-[#88A98C]">
                        Link
                      </span>

                      <h3 className="mt-2 text-lg font-semibold leading-snug">
                        A slower way to explore the world
                      </h3>

                      <p className="mt-2 text-sm text-[#747B74] dark:text-[#A0A8A0]">
                        fieldnotes.co
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {['Travel', 'Mindfulness'].map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#EEF1E9] px-2.5 py-1 text-[11px] text-[#5F695F] dark:bg-[#232923] dark:text-[#AFB8AF]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* VIDEO CARD */}
                  <div
                    className="
                      group overflow-hidden
                      rounded-2xl
                      border border-[#E9E2D8]
                      bg-white
                      transition-all duration-500
                      hover:-translate-y-1.5
                      hover:shadow-[0_18px_40px_rgba(42,50,42,0.10)]
                      dark:border-[#2A302A]
                      dark:bg-[#181C18]
                    "
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80"
                        alt="Calm interior"
                        className="h-44 w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      />

                      <div
                        className="
                          absolute left-1/2 top-1/2
                          flex h-12 w-12
                          -translate-x-1/2 -translate-y-1/2
                          items-center justify-center
                          rounded-full
                          bg-black/65
                          text-white
                          backdrop-blur-sm
                          transition-all duration-300
                          group-hover:scale-110
                          group-hover:bg-[#4D6A51]
                        "
                      >
                        ▶
                      </div>
                    </div>

                    <div className="p-4">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#56715A] dark:text-[#88A98C]">
                        Video
                      </span>

                      <h3 className="mt-2 text-lg font-semibold leading-snug">
                        Creating a home that supports focus
                      </h3>

                      <p className="mt-2 text-sm text-[#747B74] dark:text-[#A0A8A0]">
                        12 min · YouTube
                      </p>

                      <div className="mt-4 flex gap-2">
                        {['Design', 'Focus'].map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#EEF1E9] px-2.5 py-1 text-[11px] dark:bg-[#232923]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* NOTE CARD */}
                  <div
                    className="
                      group rounded-2xl
                      border border-[#E9E2D8]
                      bg-[#FFFDF8]
                      p-5
                      transition-all duration-500
                      hover:-translate-y-1.5
                      hover:shadow-[0_18px_40px_rgba(42,50,42,0.10)]
                      dark:border-[#2A302A]
                      dark:bg-[#181C18]
                    "
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#56715A] dark:text-[#88A98C]">
                        Note
                      </span>
                      <span className="text-[#A4ABA4]">•••</span>
                    </div>

                    <h3 className="text-xl font-semibold">
                      Ideas for a calmer internet
                    </h3>

                    <div className="mt-5 space-y-3 text-sm text-[#606860] dark:text-[#ACB4AC]">
                      {[
                        'Build a reading routine',
                        'Explore digital minimalism',
                        'Save inspiring spaces',
                        'Find better tools',
                      ].map((item) => (
                        <div key={item} className="flex gap-3">
                          <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-[#B9C1B9] dark:border-[#576057]" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    <span className="mt-6 inline-block rounded-full bg-[#EEF1E9] px-2.5 py-1 text-[11px] dark:bg-[#232923]">
                      Personal
                    </span>
                  </div>

                  {/* PDF CARD */}
                  <div
                    className="
                      group rounded-2xl
                      border border-[#E9E2D8]
                      bg-white
                      p-5
                      transition-all duration-500
                      hover:-translate-y-1.5
                      hover:shadow-[0_18px_40px_rgba(42,50,42,0.10)]
                      dark:border-[#2A302A]
                      dark:bg-[#181C18]
                    "
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="
                          flex h-14 w-12 shrink-0
                          items-center justify-center
                          rounded-lg
                          border border-[#D9CEC4]
                          bg-[#FFF5F0]
                          text-xl
                          transition-transform duration-300
                          group-hover:rotate-[-3deg]
                          dark:border-[#473631]
                          dark:bg-[#251D1A]
                        "
                      >
                        📄
                      </div>

                      <div>
                        <h3 className="font-semibold">Design-notes.pdf</h3>

                        <p className="mt-1 text-xs text-[#7B827B] dark:text-[#929A92]">
                          PDF · 2.4 MB
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-6 text-[#626A62] dark:text-[#A9B0A9]">
                      Notes from a design exploration session about calmer digital
                      experiences.
                    </p>

                    <span className="mt-5 inline-block rounded-full bg-[#EEF1E9] px-2.5 py-1 text-[11px] dark:bg-[#232923]">
                      Research
                    </span>
                  </div>

                  {/* QUOTE CARD */}
                  <div
                    className="
                      group flex min-h-[220px] flex-col justify-between
                      rounded-2xl
                      border border-[#E9E2D8]
                      bg-[#F7F2E9]
                      p-6
                      transition-all duration-500
                      hover:-translate-y-1.5
                      hover:shadow-[0_18px_40px_rgba(42,50,42,0.10)]
                      dark:border-[#2A302A]
                      dark:bg-[#20231E]
                    "
                  >
                    <span className="text-4xl font-serif text-[#879487] transition-transform duration-300 group-hover:-translate-y-1 dark:text-[#708270]">
                      “
                    </span>

                    <p className="text-lg leading-7 sm:text-xl sm:leading-8">
                      A calmer internet leads to a more creative, intentional life.
                    </p>

                    <p className="text-sm text-[#7A817A] dark:text-[#969D96]">
                      — A friendly reminder
                    </p>
                  </div>

                  {/* IMAGE CARD */}
                  <div
                    className="
                      group overflow-hidden
                      rounded-2xl
                      border border-[#E9E2D8]
                      bg-white
                      transition-all duration-500
                      hover:-translate-y-1.5
                      hover:shadow-[0_18px_40px_rgba(42,50,42,0.10)]
                      dark:border-[#2A302A]
                      dark:bg-[#181C18]
                    "
                  >
                    <div className="overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80"
                        alt="Green leaves"
                        className="h-44 w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                      />
                    </div>

                    <div className="p-4">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#56715A] dark:text-[#88A98C]">
                        Image
                      </span>

                      <h3 className="mt-2 text-lg font-semibold">
                        Olive leaves at home
                      </h3>

                      <div className="mt-4 flex gap-2">
                        {['Aesthetic', 'Home'].map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#EEF1E9] px-2.5 py-1 text-[11px] dark:bg-[#232923]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#7A827A] dark:text-[#8D968D] sm:text-xs sm:tracking-[0.3em]">
            Built for intentional collecting
          </p>

          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            A softer way to save the internet.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="
                group rounded-3xl
                border border-[#E4DDD2]
                bg-[#FBF9F5]
                p-5
                transition-all duration-500
                hover:-translate-y-2
                hover:border-[#C9D3C7]
                hover:shadow-[0_20px_45px_rgba(48,64,50,0.09)]
                dark:border-[#282D28]
                dark:bg-[#151815]
                dark:hover:border-[#415044]
                sm:p-6
              "
            >
              <div
                className="
                  mb-5 flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  bg-[#E8EFE5]
                  text-[#4D6A51]
                  transition-all duration-500
                  group-hover:rotate-6
                  group-hover:scale-110
                  dark:bg-[#202820]
                  dark:text-[#8FAA91]
                "
              >
                {feature.icon}
              </div>

              <h3 className="text-xl font-semibold">{feature.title}</h3>

              <p className="mt-3 text-sm leading-7 text-[#666E66] dark:text-[#A8B0A8]">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div
          className="
            rounded-[28px]
            border border-[#E5DED3]
            bg-[#FBF9F5]
            p-6
            transition-colors duration-500
            dark:border-[#292E29]
            dark:bg-[#151815]
            sm:rounded-[32px]
            sm:p-8
            md:p-12
          "
        >
          <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#7A827A] dark:text-[#8D968D] sm:text-xs sm:tracking-[0.3em]">
            How it works
          </p>

          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Save first. Organize later.
          </h2>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[#666E66] dark:text-[#A8B0A8] sm:mt-5 sm:text-lg sm:leading-8">
            inntoit helps you capture what matters without interrupting your flow.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 md:grid-cols-3 md:gap-5">
            {steps.map((step) => (
              <div
                key={step.number}
                className="
                  group rounded-2xl
                  border border-[#E6DED4]
                  bg-white
                  p-5
                  transition-all duration-500
                  hover:-translate-y-1
                  hover:shadow-md
                  dark:border-[#2A302A]
                  dark:bg-[#181C18]
                "
              >
                <span className="text-sm font-medium text-[#4D6A51] dark:text-[#8FAA91]">
                  {step.number}
                </span>

                <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>

                <p className="mt-2 text-sm leading-6 text-[#697069] dark:text-[#A8B0A8]">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div
          className="
            rounded-[28px]
            border border-[#E2DBD0]
            bg-[#4D6A51]
            px-5 py-12
            text-center text-white
            shadow-[0_20px_50px_rgba(77,106,81,0.12)]
            transition-all duration-500
            hover:shadow-[0_28px_70px_rgba(77,106,81,0.20)]
            dark:border-[#334036]
            dark:bg-[#263D2C]
            sm:rounded-[34px]
            sm:px-8
            sm:py-14
            md:px-12
            md:py-16
          "
        >
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/70 sm:text-xs sm:tracking-[0.3em]">
            Your corner of the internet
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Keep the things that matter close.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/75 sm:mt-5 sm:text-lg sm:leading-8">
            Save what catches your attention. Come back when you’re ready.
          </p>

          <Link
            href="/login"
            className="
              group mt-7
              inline-flex w-full items-center justify-center gap-3
              rounded-2xl
              bg-white
              px-6 py-3.5
              text-sm font-medium text-[#2E4131]
              transition-all duration-300
              hover:-translate-y-1
              hover:shadow-xl
              sm:mt-8
              sm:w-auto
            "
          >
            Start collecting
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-[#777F77] dark:text-[#8F988F] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-10">
        <span className="font-medium">inntoit</span>

        <span>Collect. Reflect. Return to what matters.</span>
      </footer>
    </main>
  )
}