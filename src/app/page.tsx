'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'

export default function HomePage() {
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Use Cases', href: '#use-cases' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ]

  const features = [
    {
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>,
      title: 'Universal Capture',
      text: 'Links, social posts, images, and documents. If it lives on the internet, it lives beautifully in inntoit.',
    },
    {
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>,
      title: 'Rich Editor Context',
      text: 'Don’t just save links. Write thoughts, format notes, and add context right next to the source material.',
    },
    {
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>,
      title: 'Gentle Organization',
      text: 'Nest folders, tag items, or just dump them in the inbox. Organize exactly as much as you want to.',
    },
    {
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
      title: 'Visual Search',
      text: 'A gorgeous masonry grid and blazing fast search lets you rediscover inspiration the moment you need it.',
    },
  ]

  const faqs = [
    {
      question: "Is there a browser extension?",
      answer: "Yes. Our lightweight Chrome and Safari extensions allow you to save any page, image, or text snippet to your inbox with a single click."
    },
    {
      question: "How does the social embedding work?",
      answer: "We automatically detect links from platforms like YouTube, Twitter, Instagram, and Reddit, turning them into fully interactive, native widgets directly inside your library."
    },
    {
      question: "Can I export my data?",
      answer: "Absolutely. Your mind belongs to you. You can export your entire collection as structured JSON or Markdown files at any time."
    },
    {
      question: "Is there a free tier?",
      answer: "Yes, the core inntoit experience is completely free. We offer a Pro tier for users who need unlimited document uploads and advanced AI search capabilities."
    }
  ]

  return (
    <main className="min-h-screen text-[#171A17] dark:text-[#F3F0E9] transition-colors duration-500 animate-smooth-gradient font-sans">
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
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 md:py-8">
          <Link href="/" className="text-2xl font-serif font-medium tracking-tight text-[#171A17] transition-opacity duration-300 hover:opacity-70 dark:text-[#F4F1EA] sm:text-3xl">
            inntoit
          </Link>

          <div className="hidden items-center gap-10 text-[13px] font-medium uppercase tracking-widest md:flex">
            {navLinks.map((item) => (
              <a key={item.label} href={item.href} className="text-[#171A17]/60 transition-colors duration-300 hover:text-[#171A17] dark:text-white/50 dark:hover:text-white">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleDarkMode} aria-label="Toggle dark mode" className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.04] bg-white/50 backdrop-blur-md text-[#171A17] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm dark:border-white/[0.04] dark:bg-black/50 dark:text-white">
              {isDarkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
              )}
            </button>

            <Link href="/login" className="hidden rounded-full bg-[#171A17] px-6 py-2.5 text-[12px] font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:bg-[#4D6A51] dark:bg-[#F3F0E9] dark:text-[#171A17] dark:hover:bg-[#8FAA91] sm:inline-flex">
              Sign In
            </Link>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.04] bg-white/50 backdrop-blur-md text-[#171A17] transition-all duration-300 dark:border-white/[0.04] dark:bg-black/50 dark:text-white md:hidden">
              {mobileMenuOpen ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="absolute left-4 right-4 top-20 rounded-2xl border border-black/[0.04] bg-[#FBF9F4]/90 backdrop-blur-xl p-4 shadow-2xl dark:border-white/[0.04] dark:bg-[#151815]/90 md:hidden">
            <div className="flex flex-col gap-2">
              {navLinks.map((item) => (
                <a key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium text-[#171A17]/70 transition-colors hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5">
                  {item.label}
                </a>
              ))}
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="mt-2 w-full rounded-xl bg-[#171A17] px-4 py-3.5 text-center text-[12px] font-semibold uppercase tracking-widest text-white dark:bg-[#F3F0E9] dark:text-[#171A17]">
                Start Collecting
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.04] bg-white/40 backdrop-blur-md px-4 py-1.5 mb-8 dark:border-white/[0.04] dark:bg-black/40">
            <span className="flex h-2 w-2 rounded-full bg-[#4D6A51] animate-pulse"></span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#171A17]/60 dark:text-white/60">inntoit v2.0 is live</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif text-[#171A17] dark:text-[#F3F0E9] leading-[1.1] tracking-tight mb-8">
            Your digital mind,<br />elegantly organized.
          </h1>

          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-[#171A17]/60 dark:text-white/60 leading-relaxed mb-10 font-sans">
            Save links, notes, images, and videos. Turn the chaotic internet into a calm, beautifully curated visual library that works the way your brain does.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto rounded-full bg-[#4D6A51] px-8 py-4 text-[13px] font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-[#3A523E]">
              Create Your Library
            </Link>
            <a href="#how" className="w-full sm:w-auto rounded-full border border-black/[0.08] bg-transparent px-8 py-4 text-[13px] font-semibold uppercase tracking-widest text-[#171A17] transition-all duration-300 hover:bg-black/5 dark:border-white/[0.08] dark:text-white dark:hover:bg-white/5">
              Explore Features
            </a>
          </div>
        </div>

        {/* DASHBOARD PREVIEW IMAGE */}
        <div className="mx-auto mt-20 max-w-6xl">
          <div className="relative rounded-2xl md:rounded-[40px] border border-black/[0.04] dark:border-white/[0.04] bg-white/40 dark:bg-black/40 p-2 md:p-4 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.08)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.5)] transform perspective-[2000px] hover:rotate-x-0 transition-transform duration-700 ease-out">
            <div className="absolute inset-0 bg-gradient-to-t from-[#FBF9F4] via-transparent to-transparent dark:from-[#080A08] z-20 pointer-events-none rounded-[40px] opacity-20"></div>
            {/* 
               Ensure you have your beautiful dashboard screenshot named 'dashboard-preview.png' 
               saved in the 'public' folder of your Next.js app.
            */}
            <img 
              src="/dashboard-preview.png" 
              alt="inntoit Dashboard Preview" 
              className="w-full h-auto rounded-xl md:rounded-[32px] border border-black/[0.04] dark:border-white/[0.04] shadow-2xl relative z-10"
              onError={(e) => {
                // Fallback rendering if the image isn't placed in public yet
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('min-h-[400px]', 'md:min-h-[600px]', 'flex', 'items-center', 'justify-center');
                if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.classList.remove('hidden');
              }}
            />
            <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-[#171A17]/40 dark:text-white/40 z-10">
               <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               <p className="text-sm font-medium">Place your screenshot at <code className="bg-black/5 dark:bg-white/5 px-2 py-1 rounded">public/dashboard-preview.jpg</code></p>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="border-y border-black/[0.04] dark:border-white/[0.04] py-10 bg-white/20 dark:bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#171A17]/40 dark:text-white/40 mb-6">Trusted by creative minds everywhere</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 dark:opacity-40 grayscale">
             {/* Placeholder Logos */}
             <span className="font-serif text-xl font-bold">Studio.</span>
             <span className="font-sans text-xl font-black tracking-tighter">Vektor</span>
             <span className="font-serif text-xl italic">Narrative</span>
             <span className="font-sans text-xl font-medium tracking-widest">MINIMAL</span>
             <span className="font-serif text-xl font-bold">Aura</span>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" className="mx-auto max-w-7xl px-4 py-20 lg:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-serif text-[#171A17] dark:text-[#F3F0E9] mb-4">Designed for deep work.</h2>
          <p className="text-lg text-[#171A17]/60 dark:text-white/60 font-sans max-w-2xl mx-auto">Whether you are curating visual inspiration or compiling technical research, inntoit adapts to your specific workflow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/40 dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.04] rounded-[24px] p-8 backdrop-blur-md hover:-translate-y-1 transition-transform duration-300">
             <div className="w-12 h-12 bg-[#4D6A51]/10 text-[#4D6A51] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             <h3 className="text-xl font-serif mb-3">For Designers</h3>
             <p className="text-sm text-[#171A17]/60 dark:text-white/60 leading-relaxed">Build beautiful visual moodboards. Save Pinterest pins, Dribbble shots, and raw images in a stunning masonry grid that respects aspect ratios.</p>
          </div>
          <div className="bg-white/40 dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.04] rounded-[24px] p-8 backdrop-blur-md hover:-translate-y-1 transition-transform duration-300">
             <div className="w-12 h-12 bg-[#4D6A51]/10 text-[#4D6A51] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
             </div>
             <h3 className="text-xl font-serif mb-3">For Developers</h3>
             <p className="text-sm text-[#171A17]/60 dark:text-white/60 leading-relaxed">Save GitHub repositories, StackOverflow solutions, and API documentation. Use the rich text editor to attach your own code snippets directly to saved links.</p>
          </div>
          <div className="bg-white/40 dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.04] rounded-[24px] p-8 backdrop-blur-md hover:-translate-y-1 transition-transform duration-300">
             <div className="w-12 h-12 bg-[#4D6A51]/10 text-[#4D6A51] rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
             </div>
             <h3 className="text-xl font-serif mb-3">For Researchers</h3>
             <p className="text-sm text-[#171A17]/60 dark:text-white/60 leading-relaxed">Upload PDFs, capture deep-dive articles, and natively embed YouTube essays. Group everything seamlessly into nested folders and subfolders.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-serif text-[#171A17] dark:text-[#F3F0E9] mb-6 leading-tight">Everything you find,<br/>in its right place.</h2>
            <p className="text-lg text-[#171A17]/60 dark:text-white/60 font-sans mb-10">We believe that saving a link shouldn't feel like throwing it into a black hole. inntoit automatically extracts beautiful previews, pulls official brand logos, and organizes the internet into a calm, searchable library.</p>
            
            <div className="space-y-6">
              {features.map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full border border-black/[0.04] dark:border-white/[0.04] bg-white dark:bg-white/5 flex items-center justify-center text-[#4D6A51] dark:text-[#8FAA91] shadow-sm">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-base font-bold font-sans mb-1">{feature.title}</h4>
                    <p className="text-sm text-[#171A17]/60 dark:text-white/60 leading-relaxed">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative rounded-[32px] border border-black/[0.04] dark:border-white/[0.04] bg-white/40 dark:bg-black/40 p-4 backdrop-blur-xl shadow-2xl aspect-[4/5] flex items-center justify-center overflow-hidden">
             {/* Abstract Minimalist Feature Graphic */}
             <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(77,106,81,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
             <div className="relative z-10 w-3/4 aspect-[3/4] bg-white dark:bg-[#151815] rounded-2xl shadow-xl border border-black/[0.04] dark:border-white/[0.04] p-6 flex flex-col gap-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
               <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-full mb-2"></div>
               <div className="h-4 w-3/4 bg-gray-100 dark:bg-white/5 rounded-full"></div>
               <div className="h-3 w-1/2 bg-gray-100 dark:bg-white/5 rounded-full mb-4"></div>
               <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-300 dark:text-white/20 font-serif italic">Preview Content</div>
             </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 lg:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-serif text-[#171A17] dark:text-[#F3F0E9] mb-4">Simple, transparent pricing.</h2>
          <p className="text-lg text-[#171A17]/60 dark:text-white/60 font-sans max-w-2xl mx-auto">Start building your library for free. Upgrade when your mind needs more space.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white/50 dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.04] rounded-[32px] p-8 md:p-10 backdrop-blur-md">
            <h3 className="text-xl font-serif mb-2">Curator</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold font-sans">$0</span>
              <span className="text-sm text-[#171A17]/60 dark:text-white/60">forever</span>
            </div>
            <p className="text-sm text-[#171A17]/60 dark:text-white/60 mb-8 border-b border-black/[0.04] dark:border-white/[0.04] pb-8">Perfect for individuals starting to organize their digital life.</p>
            <ul className="space-y-4 text-sm font-medium mb-10">
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-[#4D6A51]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Unlimited Links & Notes</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-[#4D6A51]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Browser Extension</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-[#4D6A51]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Basic Folder Structure</li>
              <li className="flex items-center gap-3 text-[#171A17]/40 dark:text-white/40"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> PDF & Media Uploads</li>
            </ul>
            <Link href="/login" className="block w-full rounded-full bg-white dark:bg-[#1A1D1A] border border-black/[0.08] dark:border-white/[0.08] px-6 py-3.5 text-center text-[12px] font-semibold uppercase tracking-widest text-[#171A17] dark:text-white transition-all hover:bg-black/5 dark:hover:bg-white/5">
              Start Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-white dark:bg-[#1A1D1A] border-2 border-[#4D6A51] rounded-[32px] p-8 md:p-10 shadow-2xl relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#4D6A51] text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md">Most Popular</div>
            <h3 className="text-xl font-serif mb-2">Architect</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold font-sans">$5</span>
              <span className="text-sm text-[#171A17]/60 dark:text-white/60">/ month</span>
            </div>
            <p className="text-sm text-[#171A17]/60 dark:text-white/60 mb-8 border-b border-black/[0.04] dark:border-white/[0.04] pb-8">For power users who need complete control over their files.</p>
            <ul className="space-y-4 text-sm font-medium mb-10">
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-[#4D6A51]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Everything in Curator</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-[#4D6A51]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Unlimited PDF & Media Uploads</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-[#4D6A51]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Full-Text Search (Inside PDFs)</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-[#4D6A51]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Automated Tagging</li>
            </ul>
            <Link href="/login" className="block w-full rounded-full bg-[#4D6A51] px-6 py-3.5 text-center text-[12px] font-semibold uppercase tracking-widest text-white transition-all hover:bg-[#3A523E] shadow-lg hover:shadow-xl">
              Upgrade to Architect
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20 border-t border-black/[0.04] dark:border-white/[0.04]">
        <h2 className="text-3xl font-serif text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-black/[0.04] dark:border-white/[0.04] bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300">
             <button 
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)} 
                className="w-full px-6 py-5 text-left flex items-center justify-between font-bold text-[#171A17] dark:text-[#F3F0E9] focus:outline-none"
              >
                <span>{faq.question}</span>
                <span className={`transform transition-transform duration-300 ${openFaq === idx ? 'rotate-45' : ''}`}>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </span>
              </button>
              <div className={`px-6 overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-[#171A17]/60 dark:text-white/60 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="rounded-[40px] border border-[#4D6A51]/20 bg-[#4D6A51] px-6 py-16 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-serif mb-6">Ready to clear your mind?</h2>
            <p className="text-white/80 max-w-xl mx-auto mb-10">Join thousands of creatives who have replaced their chaotic bookmark folders with a beautifully calm digital library.</p>
            <Link href="/login" className="inline-flex rounded-full bg-white px-8 py-4 text-[13px] font-semibold uppercase tracking-widest text-[#2E4131] transition-all hover:-translate-y-1 hover:shadow-xl">
              Start Collecting Today
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-black/[0.04] dark:border-white/[0.04] bg-white/20 dark:bg-black/20 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="text-2xl font-serif font-medium text-[#171A17] dark:text-[#F4F1EA]">inntoit</Link>
              <p className="mt-4 text-xs text-[#171A17]/50 dark:text-white/50 pr-4">A calmer place for the internet. Save, organize, and rediscover what matters.</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#171A17] dark:text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-[#171A17]/60 dark:text-white/60">
                <li><a href="#features" className="hover:text-[#4D6A51] transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-[#4D6A51] transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-[#4D6A51] transition-colors">Browser Extension</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#171A17] dark:text-white mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-[#171A17]/60 dark:text-white/60">
                <li><a href="#" className="hover:text-[#4D6A51] transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-[#4D6A51] transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-[#4D6A51] transition-colors">Twitter / X</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#171A17] dark:text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-[#171A17]/60 dark:text-white/60">
                <li><a href="#" className="hover:text-[#4D6A51] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#4D6A51] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-black/[0.04] dark:border-white/[0.04] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#171A17]/40 dark:text-white/40">
            <p>© {new Date().getFullYear()} inntoit. All rights reserved.</p>
            <p>Designed for focus.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}




// 'use client'

// import { useState } from 'react'
// import Link from 'next/link'
// import { useTheme } from '@/context/ThemeContext'

// export default function HomePage() {
//   const { isDarkMode, toggleDarkMode } = useTheme()
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

//   const navLinks = [
//     { label: 'Features', href: '#features' },
//     { label: 'How it works', href: '#how' },
//     { label: 'About', href: '#about' },
//   ]

//   const sidebarItems = [
//     ['Library', '124'],
//     ['Inbox', '8'],
//     ['Recent', '13'],
//     ['Connections', '24'],
//     ['Shared', '5'],
//   ]

//   const spaces = ['Design', 'Writing', 'Ideas', 'Travel', 'Work', 'Personal']

//   const features = [
//     {
//       icon: '↗',
//       title: 'Save anything',
//       text: 'Links, notes, images, videos and files all live in one place.',
//     },
//     {
//       icon: '✎',
//       title: 'Add context',
//       text: 'Write thoughts and notes so your saved things stay meaningful.',
//     },
//     {
//       icon: '⌘',
//       title: 'Organize gently',
//       text: 'Use folders and spaces without turning everything into work.',
//     },
//     {
//       icon: '⌕',
//       title: 'Find it again',
//       text: 'Search and rediscover what mattered when you saved it.',
//     },
//   ]

//   const steps = [
//     {
//       number: '01',
//       title: 'Capture',
//       text: 'Drop in a link, note, image, file or video.',
//     },
//     {
//       number: '02',
//       title: 'Organize',
//       text: 'Put it into a space when it feels natural.',
//     },
//     {
//       number: '03',
//       title: 'Return',
//       text: 'Find it again when the moment is right.',
//     },
//   ]

//   return (
//     <main
//       className="
//         min-h-screen
//         text-[#171A17]
//         dark:text-[#F3F0E9]
//         transition-colors duration-500
//         animate-smooth-gradient
//       "
//     >
//       {/* 
//         This embedded style handles the smooth moving gradient background 
//         using the exact brand colors for both Light and Dark themes.
//       */}
//       <style dangerouslySetInnerHTML={{__html: `
//         @keyframes smooth-gradient {
//           0% { background-position: 0% 50%; }
//           50% { background-position: 100% 50%; }
//           100% { background-position: 0% 50%; }
//         }
//         .animate-smooth-gradient {
//           background-size: 200% 200%;
//           animation: smooth-gradient 12s ease infinite;
//           background-image: linear-gradient(-45deg, #F5F1E8, #E2E8DE, #F8F5EE, #DDE6DB);
//         }
//         .dark .animate-smooth-gradient {
//           background-image: linear-gradient(-45deg, #0F120F, #1A221A, #0A0C0A, #141A14);
//         }
//       `}} />

//       {/* NAVBAR */}
//       <header className="relative z-50">
//         <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6">
//           <Link
//             href="/"
//             className="
//               text-2xl font-semibold tracking-tight
//               text-[#171A17]
//               transition-opacity duration-300
//               hover:opacity-70
//               dark:text-[#F4F1EA]
//               sm:text-3xl
//             "
//           >
//             inntoit
//           </Link>

//           {/* DESKTOP NAV */}
//           <div className="hidden items-center gap-8 text-sm md:flex">
//             {navLinks.map((item) => (
//               <a
//                 key={item.label}
//                 href={item.href}
//                 className="
//                   text-[#636A63]
//                   transition-all duration-300
//                   hover:-translate-y-[1px]
//                   hover:text-[#171A17]
//                   dark:text-[#9DA59D]
//                   dark:hover:text-white
//                 "
//               >
//                 {item.label}
//               </a>
//             ))}
//           </div>

//           <div className="flex items-center gap-2 sm:gap-3">
//             {/* THEME TOGGLE */}
//             <button
//               onClick={toggleDarkMode}
//               aria-label="Toggle dark mode"
//               className="
//                 flex h-10 w-10 items-center justify-center
//                 rounded-xl
//                 border border-[#D7D0C4]
//                 bg-white
//                 text-[#303630]
//                 transition-all duration-300
//                 hover:-translate-y-0.5
//                 hover:shadow-md
//                 dark:border-[#343A34]
//                 dark:bg-[#191D19]
//                 dark:text-[#EDE9E0]
//                 dark:hover:bg-[#202520]
//               "
//             >
//               {isDarkMode ? (
//                 <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
//                   <circle cx="12" cy="12" r="4" />
//                   <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
//                 </svg>
//               ) : (
//                 <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
//                   <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
//                 </svg>
//               )}
//             </button>

//             {/* DESKTOP ACTIONS: Single Login Call-to-Action */}
//             <Link
//               href="/login"
//               className="
//                 hidden
//                 rounded-xl
//                 bg-[#4D6A51]
//                 px-4 py-2.5
//                 text-sm font-medium text-white
//                 transition-all duration-300
//                 hover:-translate-y-0.5
//                 hover:shadow-lg
//                 dark:bg-[#69866E]
//                 sm:inline-flex
//               "
//             >
//               Start collecting
//             </Link>

//             {/* MOBILE MENU BUTTON */}
//             <button
//               onClick={() => setMobileMenuOpen((prev) => !prev)}
//               aria-label="Open navigation menu"
//               className="
//                 flex h-10 w-10 items-center justify-center
//                 rounded-xl
//                 border border-[#D7D0C4]
//                 bg-white
//                 text-[#303630]
//                 transition-all duration-300
//                 dark:border-[#343A34]
//                 dark:bg-[#191D19]
//                 dark:text-[#EDE9E0]
//                 md:hidden
//               "
//             >
//               {mobileMenuOpen ? (
//                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 6L6 18M6 6l12 12" /></svg>
//               ) : (
//                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
//               )}
//             </button>
//           </div>
//         </nav>

//         {/* MOBILE MENU */}
//         {mobileMenuOpen && (
//           <div className="mx-4 mb-4 rounded-2xl border border-[#DED7CC] bg-[#FBF9F4] p-4 shadow-lg dark:border-[#2A302A] dark:bg-[#151815] md:hidden">
//             <div className="flex flex-col gap-1">
//               {navLinks.map((item) => (
//                 <a
//                   key={item.label}
//                   href={item.href}
//                   onClick={() => setMobileMenuOpen(false)}
//                   className="
//                     rounded-xl
//                     px-4 py-3
//                     text-sm
//                     text-[#596159]
//                     transition-colors
//                     hover:bg-[#F0ECE5]
//                     dark:text-[#AEB5AE]
//                     dark:hover:bg-[#202520]
//                   "
//                 >
//                   {item.label}
//                 </a>
//               ))}
//             </div>

//             <div className="mt-4 grid gap-3 border-t border-[#E6DED4] pt-4 dark:border-[#292E29]">
//               <Link
//                 href="/login"
//                 onClick={() => setMobileMenuOpen(false)}
//                 className="
//                   w-full block text-center
//                   rounded-xl
//                   bg-[#4D6A51]
//                   px-4 py-3
//                   text-sm font-medium text-white
//                   transition-all
//                   dark:bg-[#69866E]
//                 "
//               >
//                 Start collecting
//               </Link>
//             </div>
//           </div>
//         )}
//       </header>

//       {/* HERO */}
//       <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-10">
//         <div
//           className="
//             relative overflow-hidden
//             rounded-[26px]
//             border border-[#E3DDD2]
//             bg-[#FBF9F4]
//             px-5 py-16
//             text-center
//             shadow-[0_20px_60px_rgba(0,0,0,0.04)]
//             transition-all duration-500
//             dark:border-[#292E29]
//             dark:bg-[#151815]
//             dark:shadow-[0_25px_70px_rgba(0,0,0,0.28)]
//             sm:rounded-[32px]
//             sm:px-8
//             sm:py-20
//             md:px-12
//             md:py-24
//             lg:rounded-[36px]
//             lg:py-28
//           "
//         >
//           <div
//             className="absolute inset-0 opacity-40 dark:opacity-[0.12]"
//             style={{
//               backgroundImage:
//                 'radial-gradient(circle, rgba(130,130,120,0.24) 1px, transparent 1px)',
//               backgroundSize: '22px 22px',
//             }}
//           />

//           <div className="relative z-10">
//             <p className="mb-5 text-[10px] uppercase tracking-[0.28em] text-[#737B73] dark:text-[#8F998F] sm:text-xs sm:tracking-[0.35em]">
//               A calmer place for the internet
//             </p>

//             <h1
//               className="
//                 mx-auto max-w-4xl
//                 text-[2.75rem]
//                 font-semibold
//                 leading-[0.98]
//                 tracking-tight
//                 sm:text-5xl
//                 md:text-6xl
//                 lg:text-7xl
//               "
//             >
//               Everything you’re into,
//               <br className="hidden sm:block" />
//               <span className="sm:ml-2">kept together.</span>
//             </h1>

//             <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#666D66] dark:text-[#AEB5AE] sm:mt-7 sm:text-lg sm:leading-8 md:text-xl">
//               Save links, notes, ideas, images, videos and files. Organize them
//               gently, connect what matters, and come back whenever you need it.
//             </p>

//             <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:mt-9 sm:max-w-none sm:flex-row sm:justify-center">
//               <Link
//                 href="/login"
//                 className="
//                   group inline-flex w-full items-center justify-center gap-3
//                   rounded-2xl
//                   bg-[#4D6A51]
//                   px-6 py-3.5
//                   text-sm font-medium text-white
//                   shadow-[0_8px_20px_rgba(77,106,81,0.18)]
//                   transition-all duration-300
//                   hover:-translate-y-1
//                   hover:shadow-[0_14px_28px_rgba(77,106,81,0.25)]
//                   dark:bg-[#69866E]
//                   sm:w-auto
//                 "
//               >
//                 Start collecting
//                 <span className="transition-transform duration-300 group-hover:translate-x-1">
//                   →
//                 </span>
//               </Link>

//               <a
//                 href="#how"
//                 className="
//                   inline-flex w-full items-center justify-center
//                   rounded-2xl
//                   border border-[#D9D2C7]
//                   bg-white
//                   px-6 py-3.5
//                   text-sm font-medium
//                   transition-all duration-300
//                   hover:-translate-y-1
//                   hover:shadow-md
//                   dark:border-[#343A34]
//                   dark:bg-[#191D19]
//                   dark:text-[#F1EEE7]
//                   dark:hover:bg-[#202520]
//                   sm:w-auto
//                 "
//               >
//                 See how it works
//               </a>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* PRODUCT PREVIEW */}
//       <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
//         <div
//           className="
//             rounded-[24px]
//             border border-[#E4DDD2]
//             bg-[#FAF8F3]
//             p-2.5
//             shadow-[0_25px_70px_rgba(0,0,0,0.05)]
//             transition-all duration-700
//             hover:shadow-[0_35px_90px_rgba(48,60,48,0.10)]
//             dark:border-[#282D28]
//             dark:bg-[#131613]
//             dark:hover:shadow-[0_35px_90px_rgba(0,0,0,0.32)]
//             sm:rounded-[30px]
//             sm:p-4
//             md:p-6
//           "
//         >
//           <div className="overflow-hidden rounded-[20px] border border-[#E8E1D7] bg-white transition-colors duration-500 dark:border-[#292E29] dark:bg-[#151815] sm:rounded-[24px]">
//             {/* WINDOW BAR */}
//             <div className="flex items-center gap-2 border-b border-[#ECE5DB] px-4 py-3 dark:border-[#292E29]">
//               <span className="h-2.5 w-2.5 rounded-full bg-[#F19A8A] sm:h-3 sm:w-3" />
//               <span className="h-2.5 w-2.5 rounded-full bg-[#F2C669] sm:h-3 sm:w-3" />
//               <span className="h-2.5 w-2.5 rounded-full bg-[#7EC47E] sm:h-3 sm:w-3" />
//             </div>

//             <div className="grid md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr]">
//               {/* SIDEBAR */}
//               <aside
//                 className="
//                   border-b border-[#ECE5DB]
//                   bg-[#FBFAF7]
//                   p-4
//                   transition-colors duration-500
//                   dark:border-[#292E29]
//                   dark:bg-[#121512]
//                   md:border-b-0
//                   md:border-r
//                   md:p-5
//                 "
//               >
//                 <div className="mb-5 text-2xl font-semibold sm:text-3xl md:mb-8">
//                   inntoit
//                 </div>

//                 <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:block md:space-y-2">
//                   {sidebarItems.map(([label, count], index) => (
//                     <div
//                       key={label}
//                       className={`
//                         flex items-center justify-between
//                         rounded-xl
//                         px-3 py-2.5
//                         text-xs
//                         transition-colors duration-300
//                         sm:text-sm
//                         ${
//                           index === 0
//                             ? 'bg-[#EDF1E8] text-[#1B221B] dark:bg-[#202820] dark:text-[#ECF0EA]'
//                             : 'text-[#626A62] hover:bg-[#F2EFE8] dark:text-[#A0A8A0] dark:hover:bg-[#1A1E1A]'
//                         }
//                       `}
//                     >
//                       <span>{label}</span>
//                       <span className="ml-2 text-[10px] sm:text-xs">{count}</span>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="mt-6 hidden md:block">
//                   <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#929992]">
//                     Spaces
//                   </p>

//                   <div className="space-y-2 text-sm text-[#636A63] dark:text-[#9CA49C]">
//                     {spaces.map((item) => (
//                       <div
//                         key={item}
//                         className="
//                           rounded-xl
//                           px-3 py-2
//                           transition-all duration-300
//                           hover:bg-[#F1EEE7]
//                           hover:pl-4
//                           dark:hover:bg-[#1B201B]
//                         "
//                       >
//                         {item}
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="mt-6 hidden rounded-2xl border border-[#E6DED3] bg-white p-4 transition-colors duration-500 dark:border-[#2B302B] dark:bg-[#181C18] md:block">
//                   <p className="text-sm leading-6 text-[#697069] dark:text-[#A8B0A8]">
//                     Collect. Reflect.
//                     <br />
//                     Return to what matters.
//                   </p>
//                 </div>
//               </aside>

//               {/* MAIN PREVIEW */}
//               <div className="p-4 sm:p-5 md:p-6 lg:p-7">
//                 <div className="mb-5 flex flex-col gap-3 lg:flex-row">
//                   <div
//                     className="
//                       flex-1
//                       rounded-2xl
//                       border border-[#E9E3D9]
//                       bg-[#F8F6F1]
//                       px-4 py-3
//                       text-sm text-[#A0A6A0]
//                       transition-all duration-300
//                       hover:border-[#C9D2C7]
//                       dark:border-[#2A302A]
//                       dark:bg-[#191D19]
//                       dark:text-[#7E877E]
//                     "
//                   >
//                     Search your library...
//                   </div>

//                   <div className="flex flex-wrap gap-2">
//                     {['All', 'Links', 'Notes', 'Images', 'Videos'].map(
//                       (item, index) => (
//                         <span
//                           key={item}
//                           className={`
//                             rounded-full
//                             px-3 py-1.5
//                             text-xs
//                             transition-all duration-300
//                             hover:-translate-y-0.5
//                             ${
//                               index === 0
//                                 ? 'bg-[#4D6A51] text-white dark:bg-[#69866E]'
//                                 : 'bg-[#F0ECE5] text-[#606960] hover:bg-[#E8E4DC] dark:bg-[#202420] dark:text-[#A9B0A9] dark:hover:bg-[#282D28]'
//                             }
//                           `}
//                         >
//                           {item}
//                         </span>
//                       )
//                     )}
//                   </div>
//                 </div>

//                 <div className="mb-5 sm:mb-6">
//                   <h2 className="text-2xl font-semibold sm:text-3xl">
//                     Your library
//                   </h2>

//                   <p className="mt-1 text-sm text-[#747C74] dark:text-[#959D95]">
//                     124 saved things
//                   </p>
//                 </div>

//                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
//                   {/* LINK CARD */}
//                   <div
//                     className="
//                       group overflow-hidden
//                       rounded-2xl
//                       border border-[#E9E2D8]
//                       bg-white
//                       transition-all duration-500
//                       hover:-translate-y-1.5
//                       hover:shadow-[0_18px_40px_rgba(42,50,42,0.10)]
//                       dark:border-[#2A302A]
//                       dark:bg-[#181C18]
//                     "
//                   >
//                     <div className="overflow-hidden">
//                       <img
//                         src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
//                         alt="Coastal landscape"
//                         className="h-44 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
//                       />
//                     </div>

//                     <div className="p-4">
//                       <span className="text-[10px] uppercase tracking-[0.18em] text-[#56715A] dark:text-[#88A98C]">
//                         Link
//                       </span>

//                       <h3 className="mt-2 text-lg font-semibold leading-snug">
//                         A slower way to explore the world
//                       </h3>

//                       <p className="mt-2 text-sm text-[#747B74] dark:text-[#A0A8A0]">
//                         fieldnotes.co
//                       </p>

//                       <div className="mt-4 flex flex-wrap gap-2">
//                         {['Travel', 'Mindfulness'].map((tag) => (
//                           <span
//                             key={tag}
//                             className="rounded-full bg-[#EEF1E9] px-2.5 py-1 text-[11px] text-[#5F695F] dark:bg-[#232923] dark:text-[#AFB8AF]"
//                           >
//                             {tag}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   </div>

//                   {/* VIDEO CARD */}
//                   <div
//                     className="
//                       group overflow-hidden
//                       rounded-2xl
//                       border border-[#E9E2D8]
//                       bg-white
//                       transition-all duration-500
//                       hover:-translate-y-1.5
//                       hover:shadow-[0_18px_40px_rgba(42,50,42,0.10)]
//                       dark:border-[#2A302A]
//                       dark:bg-[#181C18]
//                     "
//                   >
//                     <div className="relative overflow-hidden">
//                       <img
//                         src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80"
//                         alt="Calm interior"
//                         className="h-44 w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
//                       />

//                       <div
//                         className="
//                           absolute left-1/2 top-1/2
//                           flex h-12 w-12
//                           -translate-x-1/2 -translate-y-1/2
//                           items-center justify-center
//                           rounded-full
//                           bg-black/65
//                           text-white
//                           backdrop-blur-sm
//                           transition-all duration-300
//                           group-hover:scale-110
//                           group-hover:bg-[#4D6A51]
//                         "
//                       >
//                         ▶
//                       </div>
//                     </div>

//                     <div className="p-4">
//                       <span className="text-[10px] uppercase tracking-[0.18em] text-[#56715A] dark:text-[#88A98C]">
//                         Video
//                       </span>

//                       <h3 className="mt-2 text-lg font-semibold leading-snug">
//                         Creating a home that supports focus
//                       </h3>

//                       <p className="mt-2 text-sm text-[#747B74] dark:text-[#A0A8A0]">
//                         12 min · YouTube
//                       </p>

//                       <div className="mt-4 flex gap-2">
//                         {['Design', 'Focus'].map((tag) => (
//                           <span
//                             key={tag}
//                             className="rounded-full bg-[#EEF1E9] px-2.5 py-1 text-[11px] dark:bg-[#232923]"
//                           >
//                             {tag}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   </div>

//                   {/* NOTE CARD */}
//                   <div
//                     className="
//                       group rounded-2xl
//                       border border-[#E9E2D8]
//                       bg-[#FFFDF8]
//                       p-5
//                       transition-all duration-500
//                       hover:-translate-y-1.5
//                       hover:shadow-[0_18px_40px_rgba(42,50,42,0.10)]
//                       dark:border-[#2A302A]
//                       dark:bg-[#181C18]
//                     "
//                   >
//                     <div className="mb-5 flex items-center justify-between">
//                       <span className="text-[10px] uppercase tracking-[0.18em] text-[#56715A] dark:text-[#88A98C]">
//                         Note
//                       </span>
//                       <span className="text-[#A4ABA4]">•••</span>
//                     </div>

//                     <h3 className="text-xl font-semibold">
//                       Ideas for a calmer internet
//                     </h3>

//                     <div className="mt-5 space-y-3 text-sm text-[#606860] dark:text-[#ACB4AC]">
//                       {[
//                         'Build a reading routine',
//                         'Explore digital minimalism',
//                         'Save inspiring spaces',
//                         'Find better tools',
//                       ].map((item) => (
//                         <div key={item} className="flex gap-3">
//                           <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-[#B9C1B9] dark:border-[#576057]" />
//                           <span>{item}</span>
//                         </div>
//                       ))}
//                     </div>

//                     <span className="mt-6 inline-block rounded-full bg-[#EEF1E9] px-2.5 py-1 text-[11px] dark:bg-[#232923]">
//                       Personal
//                     </span>
//                   </div>

//                   {/* PDF CARD */}
//                   <div
//                     className="
//                       group rounded-2xl
//                       border border-[#E9E2D8]
//                       bg-white
//                       p-5
//                       transition-all duration-500
//                       hover:-translate-y-1.5
//                       hover:shadow-[0_18px_40px_rgba(42,50,42,0.10)]
//                       dark:border-[#2A302A]
//                       dark:bg-[#181C18]
//                     "
//                   >
//                     <div className="flex items-start gap-4">
//                       <div
//                         className="
//                           flex h-14 w-12 shrink-0
//                           items-center justify-center
//                           rounded-lg
//                           border border-[#D9CEC4]
//                           bg-[#FFF5F0]
//                           text-xl
//                           transition-transform duration-300
//                           group-hover:rotate-[-3deg]
//                           dark:border-[#473631]
//                           dark:bg-[#251D1A]
//                         "
//                       >
//                         📄
//                       </div>

//                       <div>
//                         <h3 className="font-semibold">Design-notes.pdf</h3>

//                         <p className="mt-1 text-xs text-[#7B827B] dark:text-[#929A92]">
//                           PDF · 2.4 MB
//                         </p>
//                       </div>
//                     </div>

//                     <p className="mt-5 text-sm leading-6 text-[#626A62] dark:text-[#A9B0A9]">
//                       Notes from a design exploration session about calmer digital
//                       experiences.
//                     </p>

//                     <span className="mt-5 inline-block rounded-full bg-[#EEF1E9] px-2.5 py-1 text-[11px] dark:bg-[#232923]">
//                       Research
//                     </span>
//                   </div>

//                   {/* QUOTE CARD */}
//                   <div
//                     className="
//                       group flex min-h-[220px] flex-col justify-between
//                       rounded-2xl
//                       border border-[#E9E2D8]
//                       bg-[#F7F2E9]
//                       p-6
//                       transition-all duration-500
//                       hover:-translate-y-1.5
//                       hover:shadow-[0_18px_40px_rgba(42,50,42,0.10)]
//                       dark:border-[#2A302A]
//                       dark:bg-[#20231E]
//                     "
//                   >
//                     <span className="text-4xl font-serif text-[#879487] transition-transform duration-300 group-hover:-translate-y-1 dark:text-[#708270]">
//                       “
//                     </span>

//                     <p className="text-lg leading-7 sm:text-xl sm:leading-8">
//                       A calmer internet leads to a more creative, intentional life.
//                     </p>

//                     <p className="text-sm text-[#7A817A] dark:text-[#969D96]">
//                       — A friendly reminder
//                     </p>
//                   </div>

//                   {/* IMAGE CARD */}
//                   <div
//                     className="
//                       group overflow-hidden
//                       rounded-2xl
//                       border border-[#E9E2D8]
//                       bg-white
//                       transition-all duration-500
//                       hover:-translate-y-1.5
//                       hover:shadow-[0_18px_40px_rgba(42,50,42,0.10)]
//                       dark:border-[#2A302A]
//                       dark:bg-[#181C18]
//                     "
//                   >
//                     <div className="overflow-hidden">
//                       <img
//                         src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80"
//                         alt="Green leaves"
//                         className="h-44 w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
//                       />
//                     </div>

//                     <div className="p-4">
//                       <span className="text-[10px] uppercase tracking-[0.18em] text-[#56715A] dark:text-[#88A98C]">
//                         Image
//                       </span>

//                       <h3 className="mt-2 text-lg font-semibold">
//                         Olive leaves at home
//                       </h3>

//                       <div className="mt-4 flex gap-2">
//                         {['Aesthetic', 'Home'].map((tag) => (
//                           <span
//                             key={tag}
//                             className="rounded-full bg-[#EEF1E9] px-2.5 py-1 text-[11px] dark:bg-[#232923]"
//                           >
//                             {tag}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* FEATURES */}
//       <section id="features" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
//         <div className="mb-8 text-center sm:mb-10">
//           <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#7A827A] dark:text-[#8D968D] sm:text-xs sm:tracking-[0.3em]">
//             Built for intentional collecting
//           </p>

//           <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
//             A softer way to save the internet.
//           </h2>
//         </div>

//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
//           {features.map((feature) => (
//             <div
//               key={feature.title}
//               className="
//                 group rounded-3xl
//                 border border-[#E4DDD2]
//                 bg-[#FBF9F5]
//                 p-5
//                 transition-all duration-500
//                 hover:-translate-y-2
//                 hover:border-[#C9D3C7]
//                 hover:shadow-[0_20px_45px_rgba(48,64,50,0.09)]
//                 dark:border-[#282D28]
//                 dark:bg-[#151815]
//                 dark:hover:border-[#415044]
//                 sm:p-6
//               "
//             >
//               <div
//                 className="
//                   mb-5 flex h-10 w-10
//                   items-center justify-center
//                   rounded-xl
//                   bg-[#E8EFE5]
//                   text-[#4D6A51]
//                   transition-all duration-500
//                   group-hover:rotate-6
//                   group-hover:scale-110
//                   dark:bg-[#202820]
//                   dark:text-[#8FAA91]
//                 "
//               >
//                 {feature.icon}
//               </div>

//               <h3 className="text-xl font-semibold">{feature.title}</h3>

//               <p className="mt-3 text-sm leading-7 text-[#666E66] dark:text-[#A8B0A8]">
//                 {feature.text}
//               </p>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* HOW IT WORKS */}
//       <section id="how" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
//         <div
//           className="
//             rounded-[28px]
//             border border-[#E5DED3]
//             bg-[#FBF9F5]
//             p-6
//             transition-colors duration-500
//             dark:border-[#292E29]
//             dark:bg-[#151815]
//             sm:rounded-[32px]
//             sm:p-8
//             md:p-12
//           "
//         >
//           <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#7A827A] dark:text-[#8D968D] sm:text-xs sm:tracking-[0.3em]">
//             How it works
//           </p>

//           <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
//             Save first. Organize later.
//           </h2>

//           <p className="mt-4 max-w-2xl text-base leading-7 text-[#666E66] dark:text-[#A8B0A8] sm:mt-5 sm:text-lg sm:leading-8">
//             inntoit helps you capture what matters without interrupting your flow.
//           </p>

//           <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 md:grid-cols-3 md:gap-5">
//             {steps.map((step) => (
//               <div
//                 key={step.number}
//                 className="
//                   group rounded-2xl
//                   border border-[#E6DED4]
//                   bg-white
//                   p-5
//                   transition-all duration-500
//                   hover:-translate-y-1
//                   hover:shadow-md
//                   dark:border-[#2A302A]
//                   dark:bg-[#181C18]
//                 "
//               >
//                 <span className="text-sm font-medium text-[#4D6A51] dark:text-[#8FAA91]">
//                   {step.number}
//                 </span>

//                 <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>

//                 <p className="mt-2 text-sm leading-6 text-[#697069] dark:text-[#A8B0A8]">
//                   {step.text}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* FINAL CTA */}
//       <section id="about" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
//         <div
//           className="
//             rounded-[28px]
//             border border-[#E2DBD0]
//             bg-[#4D6A51]
//             px-5 py-12
//             text-center text-white
//             shadow-[0_20px_50px_rgba(77,106,81,0.12)]
//             transition-all duration-500
//             hover:shadow-[0_28px_70px_rgba(77,106,81,0.20)]
//             dark:border-[#334036]
//             dark:bg-[#263D2C]
//             sm:rounded-[34px]
//             sm:px-8
//             sm:py-14
//             md:px-12
//             md:py-16
//           "
//         >
//           <p className="text-[10px] uppercase tracking-[0.28em] text-white/70 sm:text-xs sm:tracking-[0.3em]">
//             Your corner of the internet
//           </p>

//           <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
//             Keep the things that matter close.
//           </h2>

//           <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/75 sm:mt-5 sm:text-lg sm:leading-8">
//             Save what catches your attention. Come back when you’re ready.
//           </p>

//           <Link
//             href="/login"
//             className="
//               group mt-7
//               inline-flex w-full items-center justify-center gap-3
//               rounded-2xl
//               bg-white
//               px-6 py-3.5
//               text-sm font-medium text-[#2E4131]
//               transition-all duration-300
//               hover:-translate-y-1
//               hover:shadow-xl
//               sm:mt-8
//               sm:w-auto
//             "
//           >
//             Start collecting
//             <span className="transition-transform duration-300 group-hover:translate-x-1">
//               →
//             </span>
//           </Link>
//         </div>
//       </section>

//       {/* FOOTER */}
//       <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-[#777F77] dark:text-[#8F988F] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-10">
//         <span className="font-medium">inntoit</span>

//         <span>Collect. Reflect. Return to what matters.</span>
//       </footer>
//     </main>
//   )
// }