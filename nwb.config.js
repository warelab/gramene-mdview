module.exports = {
  type: 'react-component',
  npm: {
    esModules: true,
    umd: false
  },
  webpack: {
    rules: {
      test: /\.css$/i,
      use: ['style-loader','css-loader']
    }
  }
}
