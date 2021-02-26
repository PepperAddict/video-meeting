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
mutation postMessage($room: String!, $user: String!, $content: String!) {
    postMessage (room: $room, user: $user, content: $content)
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