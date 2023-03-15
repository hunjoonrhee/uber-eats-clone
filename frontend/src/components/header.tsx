import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Link } from 'react-router-dom';
import { authToken, isLoggedInVar } from '../apollo';
import { LOCALSTORAGE_TOKEN } from '../constants';
import { useMe } from '../hooks/useMe';
import uberLogo from '../images/logo.svg';

export const Header: React.FC = () => {
  const { data } = useMe();
  const handleOnClick = () => {
    localStorage.setItem(LOCALSTORAGE_TOKEN, '');
    authToken('');
    isLoggedInVar(false);
  };

  return (
    <>
      {!data?.me.verified && (
        <div className="bg-red-500 p-3 text-center text-xs text-white">
          <span> Please verify your email</span>
        </div>
      )}
      <header className=" py-4">
        <div className="w-full px-5 xl:px-0 max-w-screen-xl mx-auto flex justify-between items-center">
          <Link to="/">
            <img src={uberLogo} className="w-36" alt="Uber Eats" />
          </Link>
          <span className="text-xs">
            <Link to="/edit-profile">
              <FontAwesomeIcon icon={faUser} className="text-xl" />
            </Link>
          </span>
          <span>
            <Link to="/">
              <button onClick={handleOnClick}>Log out</button>
            </Link>
          </span>
        </div>
      </header>
    </>
  );
};
