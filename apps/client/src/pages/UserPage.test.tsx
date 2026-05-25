import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { useSession } from '../lib/auth-client'
import { renderWithQuery } from '../test/renderWithQuery'
import UserPage from './UserPage'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    isAxiosError: vi.fn().mockReturnValue(false),
  },
}))

vi.mock('../lib/auth-client', () => ({
  useSession: vi.fn(),
}))

vi.mock('../components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const CURRENT_USER = {
  id: 'user-admin',
  name: 'Alice Admin',
  email: 'alice@test.com',
  role: 'ADMIN' as const,
  createdAt: '2024-01-15T00:00:00Z',
}

const OTHER_ADMIN = {
  id: 'user-admin-2',
  name: 'Bob Admin',
  email: 'bob@test.com',
  role: 'ADMIN' as const,
  createdAt: '2024-02-01T00:00:00Z',
}

const CLIENT_USER = {
  id: 'user-client',
  name: 'Charlie Client',
  email: 'charlie@test.com',
  role: 'CLIENT' as const,
  createdAt: '2024-03-01T00:00:00Z',
}

function renderPage() {
  return renderWithQuery(<UserPage />)
}

describe('UserPage', () => {
  beforeEach(() => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: 'user-admin' } },
      isPending: false,
      error: null,
    } as ReturnType<typeof useSession>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('loading state', () => {
    beforeEach(() => {
      vi.mocked(axios.get).mockReturnValue(new Promise(() => {}))
    })

    it('shows column headers', () => {
      renderPage()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()
      expect(screen.getByText('Joined')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('renders 4 skeleton rows with 5 cells each', () => {
      renderPage()
      expect(screen.getAllByRole('cell')).toHaveLength(20)
    })

    it('does not show any user names', () => {
      renderPage()
      expect(screen.queryByText('Alice Admin')).not.toBeInTheDocument()
    })
  })

  describe('loaded state', () => {
    beforeEach(() => {
      vi.mocked(useSession).mockReturnValue({
        data: { user: { id: 'user-admin' } },
        isPending: false,
        error: null,
      } as ReturnType<typeof useSession>)
      vi.mocked(axios.get).mockResolvedValue({ data: [CURRENT_USER, OTHER_ADMIN, CLIENT_USER] })
    })

    it('renders a row for each user', async () => {
      renderPage()
      expect(await screen.findByText('Alice Admin')).toBeInTheDocument()
      expect(screen.getByText('Bob Admin')).toBeInTheDocument()
      expect(screen.getByText('Charlie Client')).toBeInTheDocument()
    })

    it('renders email addresses', async () => {
      renderPage()
      await screen.findByText('Alice Admin')
      expect(screen.getByText('alice@test.com')).toBeInTheDocument()
      expect(screen.getByText('bob@test.com')).toBeInTheDocument()
      expect(screen.getByText('charlie@test.com')).toBeInTheDocument()
    })

    it('renders role badges for each user', async () => {
      renderPage()
      await screen.findByText('Alice Admin')
      expect(screen.getAllByText('ADMIN')).toHaveLength(2)
      expect(screen.getByText('CLIENT')).toBeInTheDocument()
    })

    it('shows "You" for the current user row instead of an action button', async () => {
      renderPage()
      await screen.findByText('Alice Admin')
      expect(screen.getByText('You')).toBeInTheDocument()
    })

    it('does not render an action button for the current user', async () => {
      renderPage()
      await screen.findByText('Alice Admin')
      // 2 other users → 2 buttons; current user gets "You" label
      expect(screen.getAllByRole('button')).toHaveLength(2)
    })

    it('shows "Demote to Client" for other admin users', async () => {
      renderPage()
      expect(await screen.findByRole('button', { name: 'Demote to Client' })).toBeInTheDocument()
    })

    it('shows "Promote to Admin" for client users', async () => {
      renderPage()
      expect(await screen.findByRole('button', { name: 'Promote to Admin' })).toBeInTheDocument()
    })

    it('shows an error message when fetch fails', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('Network error'))
      renderPage()
      expect(await screen.findByText('Could not load users.')).toBeInTheDocument()
    })
  })

  describe('role mutation', () => {
    it('sends PATCH with ADMIN when Promote is clicked', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: [CURRENT_USER, CLIENT_USER] })
      vi.mocked(axios.patch).mockResolvedValue({ data: { ...CLIENT_USER, role: 'ADMIN' } })
      renderPage()
      await userEvent.click(await screen.findByRole('button', { name: 'Promote to Admin' }))
      expect(axios.patch).toHaveBeenCalledWith(
        '/api/users/user-client/role',
        { role: 'ADMIN' },
        { withCredentials: true },
      )
    })

    it('sends PATCH with CLIENT when Demote is clicked', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: [CURRENT_USER, OTHER_ADMIN] })
      vi.mocked(axios.patch).mockResolvedValue({ data: { ...OTHER_ADMIN, role: 'CLIENT' } })
      renderPage()
      await userEvent.click(await screen.findByRole('button', { name: 'Demote to Client' }))
      expect(axios.patch).toHaveBeenCalledWith(
        '/api/users/user-admin-2/role',
        { role: 'CLIENT' },
        { withCredentials: true },
      )
    })

    it('updates the badge to ADMIN after promotion', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: [CURRENT_USER, CLIENT_USER] })
      vi.mocked(axios.patch).mockResolvedValue({ data: { ...CLIENT_USER, role: 'ADMIN' } })
      renderPage()
      await userEvent.click(await screen.findByRole('button', { name: 'Promote to Admin' }))
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Demote to Client' })).toBeInTheDocument(),
      )
    })

    it('updates the badge to CLIENT after demotion', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: [CURRENT_USER, OTHER_ADMIN] })
      vi.mocked(axios.patch).mockResolvedValue({ data: { ...OTHER_ADMIN, role: 'CLIENT' } })
      renderPage()
      await userEvent.click(await screen.findByRole('button', { name: 'Demote to Client' }))
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Promote to Admin' })).toBeInTheDocument(),
      )
    })

    it('shows "Saving…" on the button while the mutation is in flight', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: [CURRENT_USER, CLIENT_USER] })
      vi.mocked(axios.patch).mockReturnValue(new Promise(() => {}))
      renderPage()
      await userEvent.click(await screen.findByRole('button', { name: 'Promote to Admin' }))
      expect(await screen.findByRole('button', { name: 'Saving…' })).toBeInTheDocument()
    })
  })
})
