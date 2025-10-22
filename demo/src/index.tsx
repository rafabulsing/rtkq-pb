import { render } from 'preact';
import './style.css';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { api, cnhsApi, driversApi, pb, testsApi } from "./api";
import { useEffect } from 'react';

export const store = configureStore({
  reducer: {
		[api.reducerPath]: api.reducer,
	},
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export function App() {
	useEffect(() => {
		pb.collection("accounts").authWithPassword("rafabulsing@gmail.com", "Password1!");
	}, []);
	return (
		<Provider store={store}>
			<div>
				<Drivers />
				{/* <Cnhs /> */}
			</div>
		</Provider>
	);
}

function Cnhs() {
	const cnhsQuery = cnhsApi.useGetFullListCnhsQuery({
		expand: {
			driver: {},
		},
	});

	const cnhs = cnhsQuery.currentData ?? [];

	return (
		<>
			<h1>CNHs</h1>
			<table>
				<thead>
					<tr>
						<td>id</td>
						<td>number</td>
						<td>driver</td>
						<td>categories</td>
						<td>expand</td>
					</tr>
				</thead>
				<tbody>
					{cnhs.map((c) => (
						<tr>
							<td>{c.id}</td>
							<td>{c.number}</td>
							<td>{c.driver}</td>
							<td>{c.categories.join(", ")}</td>
							<td>{JSON.stringify(c.expand.driver)}</td>
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
}

function Drivers() {
	const driversQuery = driversApi.useGetFullListDriversQuery({
		expand: {}
	});

	const drivers = driversQuery.currentData ?? [];

	return (
		<>
			<h1>Drivers</h1>
			<table>
				<thead>
					<tr>
						<td>id</td>
						<td>avatar</td>
						<td>fullName</td>
						<td>email</td>
						<td>deleted</td>
					</tr>
				</thead>
				<tbody>
					{drivers.map((d) => (
						<tr>
							<td>{d.id}</td>
							<td>{d.avatar}</td>
							<td>{d.fullName}</td>
							<td>{d.email}</td>
							<td>{d.deleted}</td>
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
}

render(<App />, document.getElementById('app'));
