'use client';

import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import MagneticButton from '@/components/ui/MagneticButton';

const plans = [
  {
    name: 'Free Plan',
    subtitle: 'For casual',
    price: '$0',
    period: '',
    note: 'Forever Free',
    popular: false,
    cta: 'Sign up now',
    ctaHref: '/register',
    features: [
      { text: 'Up to 1GB per transfer', included: true },
      { text: 'Transfer expiry: 3 days', included: true },
      { text: 'No account required', included: true },
      { text: 'Unlimited bandwidth', included: true },
      { text: 'Play/view media & PDFs', included: true },
      { text: 'Stats & download tracking', included: true },
      { text: 'Custom download pages', included: false },
      { text: 'Password protection', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Premium Plan',
    subtitle: 'For hobbyists',
    price: '$9',
    period: '/month',
    note: 'Cancel anytime',
    popular: true,
    cta: 'Sign Up for Premium',
    ctaHref: '/register?plan=premium',
    features: [
      { text: 'Up to 50GB per transfer', included: true },
      { text: 'Transfer expiry: 365 days', included: true },
      { text: 'Account with email login', included: true },
      { text: 'Unlimited bandwidth', included: true },
      { text: 'Play/view media & PDFs', included: true },
      { text: 'Stats & download tracking', included: true },
      { text: 'Custom download pages', included: true },
      { text: 'Password protection', included: true },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Ultra Plan',
    subtitle: 'For pros',
    price: '$39',
    period: '/month',
    note: 'Cancel anytime',
    popular: false,
    cta: 'Sign Up for Ultra',
    ctaHref: '/register?plan=ultra',
    features: [
      { text: 'Up to 200GB per transfer', included: true },
      { text: 'Transfer expiry: Unlimited', included: true },
      { text: 'Account with email login', included: true },
      { text: 'Unlimited bandwidth', included: true },
      { text: 'Play/view media & PDFs', included: true },
      { text: 'Stats & download tracking', included: true },
      { text: 'Custom download pages', included: true },
      { text: 'Password protection', included: true },
      { text: 'Priority support', included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4">
      {/* Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'monospace' }}>
          Simple, transparent{' '}
          <span style={{ color: '#D4A017' }}>pricing</span>
        </h1>
        <p className="text-gray-500 text-base">No hidden fees. Cancel anytime.</p>
      </motion.div>

      {/* Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            className="relative rounded-2xl flex flex-col"
            style={{
              border: plan.popular ? '2px solid #D4A017' : '1px solid #e5e7eb',
              background: '#fff',
              boxShadow: plan.popular
                ? '0 8px 32px rgba(212,160,23,0.15)'
                : '0 2px 12px rgba(0,0,0,0.06)',
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            {/* Most Popular badge */}
            {plan.popular && (
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full text-xs font-bold text-white tracking-widest uppercase"
                style={{ background: 'linear-gradient(to right, #F5C842, #D4A017)' }}
              >
                Most Popular
              </div>
            )}

            <div className="p-7 flex flex-col flex-1">
              {/* Plan name */}
              <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{plan.subtitle}</p>
              </div>

              {/* Price */}
              <div className="mb-1">
                <span
                  className="text-5xl font-extrabold"
                  style={{ color: '#D4A017' }}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-gray-500 text-base ml-1">{plan.period}</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-6">{plan.note}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5">
                    {f.included ? (
                      <Check
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        style={{ color: '#D4A017' }}
                      />
                    ) : (
                      <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-300" />
                    )}
                    <span
                      className={`text-sm ${f.included ? 'text-gray-700' : 'text-gray-300'}`}
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <MagneticButton
                as="a"
                href={plan.ctaHref}
                className="w-full text-center py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={
                  plan.popular
                    ? {
                        background: 'linear-gradient(to right, #F5C842, #D4A017)',
                        color: '#fff',
                      }
                    : {
                        border: '1.5px solid #D4A017',
                        color: '#D4A017',
                        background: 'transparent',
                      }
                }
              >
                {plan.cta}
              </MagneticButton>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
