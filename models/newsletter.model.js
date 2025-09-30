import { DataTypes } from 'sequelize'

const NewsLetterModel = (sequelize) => {
    return sequelize.define('NewsLetter', {
    subscriptionId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: 'Must be a valid email address' },
            notEmpty: { msg: 'Email cannot be empty' },
        },
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isIP: { msg: 'Must be a valid IP address' },
        },
    },
    status: {
        type: DataTypes.ENUM('subscribed', 'unsubscribed'),
        defaultValue: 'subscribed',
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    subscribedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'news_letter',
    timestamps: true,
    underscored: true,
})
}

export default NewsLetterModel