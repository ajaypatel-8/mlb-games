import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/Schedule', () => () => <div>Schedule</div>);

test('renders MLB Scores heading', () => {
  render(<App />);
  const headingElement = screen.getByRole('heading', { name: /MLB Scores/i });
  expect(headingElement).toBeInTheDocument();
});
