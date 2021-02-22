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
