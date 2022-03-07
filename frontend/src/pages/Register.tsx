import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../hooks';

export const redirectQueryKey = `returnUrl`;

function Register() {
  const [username, setUsername] = React.useState('');
  const { user, registerUsername } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handleSubmit: React.FormEventHandler<HTMLFormElement> =
    React.useCallback(
      async (e) => {
        e.preventDefault();
        console.log(e);
        await registerUsername(username);
        navigate(searchParams.get(redirectQueryKey) ?? '/');
      },
      [navigate, registerUsername, searchParams, username],
    );
  const title = React.useMemo(
    () =>
      user === null
        ? 'Register a username to continue'
        : 'Update your username',
    [user],
  );
  const buttonTitle = React.useMemo(
    () => (user === null ? 'Register Username' : 'Update Username'),
    [user],
  );
  return (
    <div className="container mx-auto">
      <div className="bg-slate-100 shadow-md rounded-lg py-8 px-4 mx-4 my-4">
        <h1 className="text-3xl mb-4">{title}</h1>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Enter a username..."
            id="username-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <Button type="submit">{buttonTitle}</Button>
        </form>
      </div>
    </div>
  );
}

export default Register;
