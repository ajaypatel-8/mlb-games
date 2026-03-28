import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./components/Schedule', () => () => <div>Schedule</div>);
jest.mock('./components/StandingsPage', () => () => <div>Standings</div>);

test('renders MLB Scores heading', () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>
  );
  const headingElement = screen.getByRole('heading', { name: /MLB Scores/i });
  expect(headingElement).toBeInTheDocument();
});
