const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();
const mockInstance = {
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
  get: mockGet,
  post: mockPost,
  put: mockPut,
  delete: mockDelete,
};

const createMock = jest.fn(() => mockInstance);

module.exports = createMock;
module.exports.create = createMock;
module.exports.__mockInstance = mockInstance;
module.exports.__mockFns = { get: mockGet, post: mockPost, put: mockPut, delete: mockDelete };
