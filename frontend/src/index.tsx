import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider, AuthProvider } from './providers';
import './index.css';
import reportWebVitals from './reportWebVitals';
import Router from './routes/Router';

ReactDOM.render(
  <React.StrictMode>
    <ApolloProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
