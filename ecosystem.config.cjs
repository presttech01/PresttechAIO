module.exports = {
  apps: [
    {
      name: 'presttech-ops',
      script: 'dist/index.cjs',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      }
    }
  ]
};