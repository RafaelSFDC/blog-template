import { createFileRoute, Outlet } from '@tanstack/react-router'
import Header from '../components/Header'
import Footer from '../components/Footer'

export const Route = createFileRoute('/_public')({
  component: PublicLayout,
})

function PublicLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}
