'use client';

import React from 'react';
import { motion } from 'motion/react';
import { UploadForm } from '@/components/forms/UploadForm';

export default function UploadPage() {
  const handleUploadComplete = (shareCode: string, fileName: string) => {
    console.log(`File uploaded: ${fileName} with share code: ${shareCode}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut' as const,
      },
    },
  };

  const featureVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut' as const,
      },
    },
    hover: {
      y: -4,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-4xl font-bold text-gray-900 mb-4"
            variants={itemVariants}
          >
            Share Files Securely
          </motion.h1>
          <motion.p
            className="text-xl text-gray-600"
            variants={itemVariants}
          >
            Upload a file and get a unique code to share with anyone
          </motion.p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <UploadForm onUploadComplete={handleUploadComplete} />
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
        >
          <motion.div
            className="bg-white rounded-lg shadow p-6"
            variants={featureVariants}
            whileHover="hover"
          >
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Encrypted
            </h3>
            <p className="text-gray-600">
              Your files are encrypted with AES-256 before storage
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-lg shadow p-6"
            variants={featureVariants}
            whileHover="hover"
          >
            <div className="text-3xl mb-3">⏱️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Auto-Delete
            </h3>
            <p className="text-gray-600">
              Files automatically delete after 20 minutes
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-lg shadow p-6"
            variants={featureVariants}
            whileHover="hover"
          >
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Scanned
            </h3>
            <p className="text-gray-600">
              All files are scanned for malware before storage
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
