'use client'

import { Github, Linkedin, Code2 } from 'lucide-react'

export default function DeveloperInfo() {
  return (
    <div className="glass-card p-6 mt-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Developer Info */}
        <div className="flex items-center gap-3">
          <div className="glass-card p-3 rounded-full">
            <Code2 className="text-white" size={24} />
          </div>
          <div>
            <div className="text-white/60 text-xs uppercase tracking-wider">Developed by</div>
            <div className="text-white text-lg font-semibold">Sricharan</div>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-3">
          <a
            href="https://www.linkedin.com/in/sricharan-a-00603321b/"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-white/20 transition-all duration-300 group"
          >
            <Linkedin className="text-blue-400 group-hover:text-blue-300 transition-colors" size={20} />
            <span className="text-white font-medium">LinkedIn</span>
          </a>

          <a
            href="https://github.com/Sricharan07"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-white/20 transition-all duration-300 group"
          >
            <Github className="text-purple-400 group-hover:text-purple-300 transition-colors" size={20} />
            <span className="text-white font-medium">GitHub</span>
          </a>
        </div>
      </div>
    </div>
  )
}
