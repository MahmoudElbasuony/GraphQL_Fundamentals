const gql = require("graphql-tag");
const { ApolloServer } = require("apollo-server");
const users_list = [];
const typeDefs = gql`
  # here it is a comment will not displayed in tools
  """
  User is my type [ this will be shown in dev tools ]
  """
  interface IUser {
    id: ID
    email: String!
    gender: Gender!
    type: UserType!
  }
  type Employee implements IUser {
    id: ID
    email: String!
    gender: Gender!
    type: UserType!
  }
  type Admin implements IUser {
    id: ID
    email: String!
    gender: Gender!
    isAdmin: Boolean!
    type: UserType!
  }
  enum UserType {
    Admin
    Employee
  }
  enum Gender {
    Other
    Male
    Female
  }
  type Query {
    user(id: String): IUser
    users: [IUser]!
  }
  input newUserInput {
    email: String!
    gender: Gender!
    type: UserType!
  }
  type Mutation {
    newUser(input: newUserInput!): IUser!
  }
`;

const resolvers = {
  Query: {
    user(_, { id }, ctx) {
      const u = users_list.find((x) => x.id == id);
      if (u) {
        return u;
      } else {
        return null;
      }
    },
    users(_, __, ctx) {
      return users_list;
    },
  },
  Mutation: {
    newUser(_, { input }) {
      let u = {
        email: input.email,
        id: Date.now(),
        gender: input.gender,
        type: input.type,
      };
      if (input.type === "Admin") u.isAdmin = true;
      users_list.push(u);
      return u;
    },
  },
  IUser: {
    __resolveType(user) {
      return user.type === "Admin" ? "Admin" : "Employee";
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => {
    return { data: "Mahmoud" };
  },
});

server.listen(4000).then(() => console.log("listen on port 4000"));
