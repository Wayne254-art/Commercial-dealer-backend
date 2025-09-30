
import { DataTypes } from 'sequelize'

const AdminSellerModel = (sequelize) => {
  return sequelize.define('AdminSellerMessage', {
    messageId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    senderName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    senderId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    receverId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'unseen'
    }
  }, {
    timestamps: true,
    tableName: 'admin_seller_messages'
  });
}

export default AdminSellerModel;
