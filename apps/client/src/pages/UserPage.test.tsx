import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { useSession } from '../lib/auth-client'
import { renderWithQuery } from '../test/renderWithQuery'
import UserPage from './UserPage'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
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

    it('does not render a role-toggle or delete button for the current user', async () => {
      renderPage()
      await screen.findByText('Alice Admin')
      // Create User(1) + current-user edit(1) + other-admin Demote+edit(2) + client Promote+trash+edit(3) = 7
      expect(screen.getAllByRole('button')).toHaveLength(7)
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

  describe('Create User modal', () => {
    beforeEach(() => {
      vi.mocked(axios.get).mockResolvedValue({ data: [CURRENT_USER] })
    })

    it('renders a "Create User" button', async () => {
      renderPage()
      await screen.findByText('Alice Admin')
      expect(screen.getByRole('button', { name: 'Create User' })).toBeInTheDocument()
    })

    it('opens the modal when "Create User" is clicked', async () => {
      renderPage()
      await screen.findByText('Alice Admin')
      await userEvent.click(screen.getByRole('button', { name: 'Create User' }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })

    it('shows validation errors when submitting empty form', async () => {
      renderPage()
      await screen.findByText('Alice Admin')
      await userEvent.click(screen.getByRole('button', { name: 'Create User' }))
      await userEvent.click(screen.getByRole('button', { name: 'Create User', hidden: false }))
      expect(await screen.findByText('Name must be at least 3 characters')).toBeInTheDocument()
      expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    })

    it('calls POST /api/users on valid submit and closes modal', async () => {
      const newUser = { id: 'new-id', name: 'Dave New', email: 'dave@test.com', role: 'CLIENT' as const, createdAt: '2026-01-01T00:00:00Z' }
      vi.mocked(axios.post).mockResolvedValue({ data: newUser })
      renderPage()
      await screen.findByText('Alice Admin')
      await userEvent.click(screen.getByRole('button', { name: 'Create User' }))
      await userEvent.type(screen.getByLabelText('Name'), 'Dave New')
      await userEvent.type(screen.getByLabelText('Email'), 'dave@test.com')
      await userEvent.type(screen.getByLabelText('Password'), 'password123')
      await userEvent.click(screen.getByRole('button', { name: 'Create User' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(axios.post).toHaveBeenCalledWith(
        '/api/users',
        { name: 'Dave New', email: 'dave@test.com', password: 'password123' },
        { withCredentials: true },
      )
    })

    it('appends the new user to the list after creation', async () => {
      const newUser = { id: 'new-id', name: 'Dave New', email: 'dave@test.com', role: 'CLIENT' as const, createdAt: '2026-01-01T00:00:00Z' }
      vi.mocked(axios.post).mockResolvedValue({ data: newUser })
      renderPage()
      await screen.findByText('Alice Admin')
      await userEvent.click(screen.getByRole('button', { name: 'Create User' }))
      await userEvent.type(screen.getByLabelText('Name'), 'Dave New')
      await userEvent.type(screen.getByLabelText('Email'), 'dave@test.com')
      await userEvent.type(screen.getByLabelText('Password'), 'password123')
      await userEvent.click(screen.getByRole('button', { name: 'Create User' }))
      expect(await screen.findByText('Dave New')).toBeInTheDocument()
    })

    it('shows a server error banner when email already exists', async () => {
      vi.mocked(axios.isAxiosError).mockReturnValue(true)
      vi.mocked(axios.post).mockRejectedValue({
        isAxiosError: true,
        response: { data: { error: 'A user with this email already exists' } },
      })
      renderPage()
      await screen.findByText('Alice Admin')
      await userEvent.click(screen.getByRole('button', { name: 'Create User' }))
      await userEvent.type(screen.getByLabelText('Name'), 'Alice Dupe')
      await userEvent.type(screen.getByLabelText('Email'), 'alice@test.com')
      await userEvent.type(screen.getByLabelText('Password'), 'password123')
      await userEvent.click(screen.getByRole('button', { name: 'Create User' }))
      expect(await screen.findByText('A user with this email already exists')).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('delete user', () => {
    beforeEach(() => {
      vi.mocked(axios.get).mockResolvedValue({ data: [CURRENT_USER, OTHER_ADMIN, CLIENT_USER] })
    })

    it('shows a delete button for client users', async () => {
      renderPage()
      await screen.findByText('Charlie Client')
      const trashButtons = screen.getAllByRole('button', { name: 'Delete user' })
      expect(trashButtons).toHaveLength(1)
    })

    it('does not show a delete button for admin users', async () => {
      renderPage()
      await screen.findByText('Bob Admin')
      // Only CLIENT_USER gets a trash button; OTHER_ADMIN and CURRENT_USER do not
      expect(screen.getAllByRole('button', { name: 'Delete user' })).toHaveLength(1)
    })

    it('does not show a delete button for the current user row', async () => {
      renderPage()
      await screen.findByText('Alice Admin')
      expect(screen.getByText('You')).toBeInTheDocument()
      // The trash button count stays at 1 (only CLIENT_USER)
      expect(screen.getAllByRole('button', { name: 'Delete user' })).toHaveLength(1)
    })

    it('opens the confirmation dialog with the user name when delete is clicked', async () => {
      renderPage()
      await screen.findByText('Charlie Client')
      await userEvent.click(screen.getByRole('button', { name: 'Delete user' }))
      const dialog = await screen.findByRole('alertdialog')
      expect(dialog).toBeInTheDocument()
      expect(within(dialog).getByText(/Charlie Client/)).toBeInTheDocument()
    })

    it('closes the dialog without calling DELETE when Cancel is clicked', async () => {
      renderPage()
      await screen.findByText('Charlie Client')
      await userEvent.click(screen.getByRole('button', { name: 'Delete user' }))
      await screen.findByRole('alertdialog')
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
      expect(axios.delete).not.toHaveBeenCalled()
    })

    it('calls DELETE /api/users/:id when confirmed', async () => {
      vi.mocked(axios.delete).mockResolvedValue({})
      renderPage()
      await screen.findByText('Charlie Client')
      await userEvent.click(screen.getByRole('button', { name: 'Delete user' }))
      await screen.findByRole('alertdialog')
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
      await waitFor(() =>
        expect(axios.delete).toHaveBeenCalledWith(
          '/api/users/user-client',
          { withCredentials: true },
        ),
      )
    })

    it('removes the deleted user from the list and closes the dialog', async () => {
      vi.mocked(axios.delete).mockResolvedValue({})
      renderPage()
      await screen.findByText('Charlie Client')
      await userEvent.click(screen.getByRole('button', { name: 'Delete user' }))
      await screen.findByRole('alertdialog')
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
      await waitFor(() => expect(screen.queryByText('Charlie Client')).not.toBeInTheDocument())
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })

    it('shows "Deleting…" on the confirm button while the request is in flight', async () => {
      vi.mocked(axios.delete).mockReturnValue(new Promise(() => {}))
      renderPage()
      await screen.findByText('Charlie Client')
      await userEvent.click(screen.getByRole('button', { name: 'Delete user' }))
      await screen.findByRole('alertdialog')
      await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
      expect(await screen.findByRole('button', { name: 'Deleting…' })).toBeInTheDocument()
    })
  })
})
