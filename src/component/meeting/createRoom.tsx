import React from 'react';
import {v1 as uuid} from 'uuid'
import {ApolloClient, InMemoryCache} from '@apollo/client';

const client = new ApolloClient({
    uri: 'http://localhost:8080/graphql',
    cache: new InMemoryCache()
})


export default function CreateRoom (props) {

    const create = () => {
        const id = uuid();
        props.history.push(`/room/${id}`)
    }
    return (
        <button onClick={() => create()}>Create Room</button>
    )
}