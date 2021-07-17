const gql = require("graphql-tag");
const { defaultFieldResolver, GraphQLString } = require("graphql");
const {
  ApolloServer,
  PubSub,
  SchemaDirectiveVisitor,
} = require("apollo-server");
const pubSub = new PubSub();
const createPostEvent = "Post_Created";
const users_list = [];

class LogDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    field.args.push({
        type : GraphQLString,
        name : 'dodo'
    }); 
    field.resolve = async (root, ags, ctx, info) => {
      const result = await resolver.call(this, root, ags, ctx, info);
      console.log(field.name, this.args, ags);
      return `${ags.dodo} ` + result + ` ${ags.dodo}`;
    };
  }
}
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
  directive @log(message: String! = "Default Message") on FIELD_DEFINITION
  enum UserType {
    Admin
    Employee
  }
  enum Gender {
    Other
    Male
    Female
  }
  type Post {
    text: String! @log(message: "Text here")
    dep: String @deprecated(reason: "Deprecated")
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
    createPost(text: String!): Post!
  }

  type Subscription {
    newPost: Post
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
    createPost(_, { text }) {
      const post = { text: text + " _ " + Date.now().toString() };
      pubSub.publish(createPostEvent, { newPost: post });
      return post;
    },
  },
  Subscription: {
    newPost: {
      subscribe: () => pubSub.asyncIterator(createPostEvent),
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
  subscriptions: {
    onConnect(params) {
      console.log(params);
    },
  },
  formatError(e) {
    // or  return formatted errors
    return e;
  },
  schemaDirectives: {
    log: LogDirective,
  },
  context: ({ req, connection }) => {
    if (connection) {
      return { ...connection.context };
    }
    return { data: "Mahmoud" };
  },
});

server.listen(4000).then(() => console.log("listen on port 4000"));
