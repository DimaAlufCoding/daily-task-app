import Layout from '../components/Layout'

export default function HomePage() {
  return (
    <Layout>
      <h1 className="text-2xl font-bold">Your Tasks</h1>
      <p className="mt-2 text-muted-foreground">Your Kanban board will appear here.</p>
    </Layout>
  )
}
