import { gql } from "@apollo/client";

export const GET_MESSAGES = gql`
  query {
    message {
      id
      content
      user
    }
  }
`;

export const SEND_MESSAGE = gql`
mutation postMessage($user: String!, $content: String!, $room: String!) {
    postMessage(user: $user, content: $content, room: $room)
  }
`
export const SEND_TRAN = gql`
mutation ($user: String!, $content: String!, $room: String!) {
    postTran(user: $user, content: $content, room: $room)
  }
`

export const SUB_MESSAGE = gql`
subscription ($room: String!) {
  message(room: $room) {
    id
    content
    user
  }
}
`

export const SUB_TRAN = gql`
subscription  ($room: String!) {
  transcription(room: $room) {
    id
    content
    user
  }
}
`

export const GET_ROOM = gql`
query ($id: String!){
	getRoom(id:$id) {
    id
    name
  }
}
`
export const SET_ROOM = gql`
mutation ($id: String!, $name: String!){
	setRoom(id:$id, name: $name)
}
`