import type { Metadata } from 'next'
import { rubik } from '../components/font';
import './globals.css'
import '../styles/globals.scss';
import Background from '../components/Background';
import { NavProvider } from '../context/navContext';

export const metadata: Metadata = {
  title: 'Transcendance',
  description: '42-Cursus project',
}

export default function RootLayout({ children }: {
  children: React.ReactNode
}) {
  return (
      <html lang="en">
        <body className={rubik.className}>
          <Background>
            <NavProvider>
              {children}
            </NavProvider>
          </Background>
        </body>
      </html>
  )
}
