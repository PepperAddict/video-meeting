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
mutation postMessage($user: String!, $content: String!) {
    postMessage (user: $user, content: $content)
  }
`

export const SUB_MESSAGE = gql`
subscription {
  message {
    id
    content
    user
  }
}
`

//debug later
// export const GET_MESSAGES = gql`
//   query {
//     message {
//       id
//       content
//       name
//     }
//   }
// `;

// export const SEND_MESSAGE = gql`
// mutation ($room: String!, $name: String!, $content: String!){
//   postMessage(room: $room, name: $name, content: $content)
// }
// `

// export const SUB_MESSAGE = gql`
// subscription ($room: String!) {
//   message(room: $room) {
//     id
//     content
//     name
//   }
// }
// `
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