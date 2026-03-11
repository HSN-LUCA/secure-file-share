'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'tickets'>('faq');

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is Secure File Share?',
          a: 'Secure File Share is a simple, secure platform for uploading and sharing files with unique numeric codes. No account required to get started.',
        },
        {
          q: 'How does it work?',
          a: 'Upload a file, receive a share code, share the code with anyone, and they can download using that code. Files auto-delete after expiration.',
        },
        {
          q: 'Is it free?',
          a: 'Yes! We offer a free plan with basic features. Paid plans available for more storage and longer expiration times.',
        },
      ],
    },
    {
      category: 'Uploading',
      questions: [
        {
          q: 'What file types are allowed?',
          a: 'PDF, images, documents, archives, and media files. See full list in User Guide.',
        },
        {
          q: 'What is the maximum file size?',
          a: 'Free: 100MB, Paid: 1GB, Enterprise: 10GB',
        },
        {
          q: 'How long are files kept?',
          a: 'Free: 20 minutes, Paid: 24 hours, Enterprise: Custom (up to 30 days)',
        },
      ],
    },
    {
      category: 'Security',
      questions: [
        {
          q: 'Is my file secure?',
          a: 'Yes! We use HTTPS/TLS encryption in transit, AES-256 encryption at rest, virus scanning, and automatic deletion after expiration.',
        },
        {
          q: 'Who can access my files?',
          a: 'Only people with the share code can access your files. Files are not publicly listed or searchable.',
        },
        {
          q: 'Do you scan files for viruses?',
          a: 'Yes! All files are scanned for malware before storage. Infected files are rejected.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Support & Help</h1>
          <p className="mt-2 text-gray-600">Find answers and get help with Secure File Share</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('faq')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'faq'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              FAQ
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contact'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contact Us
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tickets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Support Tickets
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-12">
            {faqs.map((section) => (
              <div key={section.category}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{section.category}</h2>
                <div className="space-y-4">
                  {section.questions.map((item, idx) => (
                    <details
                      key={idx}
                      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                    >
                      <summary className="cursor-pointer px-6 py-4 font-medium text-gray-900 hover:text-blue-600">
                        {item.q}
                      </summary>
                      <div className="px-6 py-4 border-t border-gray-200 text-gray-600">
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-700">
                Can't find your answer?{' '}
                <Link href="/support?tab=contact" className="text-blue-600 hover:text-blue-700 font-medium">
                  Contact us
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>

              <div className="space-y-6">
                {/* Email */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Email Support</h3>
                  <p className="text-gray-600 mb-2">
                    Email us at{' '}
                    <a href="mailto:support@secure-file-share.com" className="text-blue-600 hover:text-blue-700">
                      support@secure-file-share.com
                    </a>
                  </p>
                  <p className="text-sm text-gray-500">
                    Response times: Free plan 24-48h, Paid plan 2-4h, Enterprise 1h
                  </p>
                </div>

                {/* Support Hours */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Support Hours</h3>
                  <ul className="text-gray-600 space-y-1">
                    <li>Monday-Friday: 9 AM - 6 PM EST</li>
                    <li>Saturday-Sunday: 10 AM - 4 PM EST</li>
                  </ul>
                </div>

                {/* Create Ticket */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Create Support Ticket</h3>
                  <p className="text-gray-600 mb-4">
                    Log in to your account to create a support ticket and track your issue.
                  </p>
                  <Link
                    href="/dashboard/support"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Ticket
                  </Link>
                </div>

                {/* Documentation */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Documentation</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>
                      <Link href="/docs/user-guide" className="text-blue-600 hover:text-blue-700">
                        User Guide
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs/troubleshooting" className="text-blue-600 hover:text-blue-700">
                        Troubleshooting Guide
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs/api" className="text-blue-600 hover:text-blue-700">
                        API Documentation
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Support Tickets</h2>

              <p className="text-gray-600 mb-6">
                Log in to your account to view and manage your support tickets.
              </p>

              <div className="space-y-4">
                <Link
                  href="/dashboard/support"
                  className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                >
                  View My Tickets
                </Link>

                <Link
                  href="/dashboard/support/new"
                  className="block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
                >
                  Create New Ticket
                </Link>
              </div>

              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Ticket Status</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Open:</strong> Ticket created, waiting for response</li>
                  <li>• <strong>In Progress:</strong> Support team is working on it</li>
                  <li>• <strong>Waiting User:</strong> We need more information from you</li>
                  <li>• <strong>Resolved:</strong> Issue has been resolved</li>
                  <li>• <strong>Closed:</strong> Ticket is closed</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-400">
            © 2024 Secure File Share. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
