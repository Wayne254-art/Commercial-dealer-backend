import { DataTypes } from 'sequelize'

const BlogModel = (sequelize) => {
    return sequelize.define('Blog', {
        blogId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM("draft", "published"),
            defaultValue: "draft"
        },
        description1: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        description2: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        image: {
            type: DataTypes.STRING,
            allowNull: false
        },
    }, {
        tableName: 'blogs',
        timestamps: true
    })
}

export default BlogModel;