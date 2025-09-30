import { Sequelize } from 'sequelize'

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        logging: false,
    }
)

sequelize.authenticate()
    .then(() => {
        console.log('Database Connection Established')
    })
    .catch((err) => {
        console.error('Error Connecting to Database', err)
    })

export { sequelize }