
import { DataTypes } from 'sequelize'

const SellerCustomerMessageModel = (sequelize) => {
  return sequelize.define('SellerCustomerMessage', {
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
    tableName: 'seller_customer_messages'
  });
}

export default SellerCustomerMessageModel;
