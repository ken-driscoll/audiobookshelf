const chai = require('chai')
const sinon = require('sinon')
const { expect } = chai

const { DataTypes } = require('sequelize')

const { up, down } = require('../../../server/migrations/v2.36.0-add-collection-cover')

describe('Migration v2.36.0-add-collection-cover', () => {
  let queryInterface, logger

  beforeEach(() => {
    queryInterface = {
      addColumn: sinon.stub().resolves(),
      removeColumn: sinon.stub().resolves(),
      tableExists: sinon.stub().resolves(true),
      describeTable: sinon.stub().resolves({}),
      sequelize: {
        Sequelize: {
          DataTypes: {
            STRING: DataTypes.STRING
          }
        }
      }
    }

    logger = {
      info: sinon.stub(),
      error: sinon.stub()
    }
  })

  describe('up', () => {
    it('should add the coverPath column to the collections table', async () => {
      await up({ context: { queryInterface, logger } })

      expect(queryInterface.addColumn.calledOnce).to.be.true
      expect(
        queryInterface.addColumn.calledWith('collections', 'coverPath', {
          type: DataTypes.STRING,
          allowNull: true
        })
      ).to.be.true

      expect(logger.info.calledWith('[2.36.0 migration] UPGRADE BEGIN: 2.36.0-add-collection-cover')).to.be.true
      expect(logger.info.calledWith('[2.36.0 migration] Adding coverPath column to collections table')).to.be.true
      expect(logger.info.calledWith('[2.36.0 migration] UPGRADE END: 2.36.0-add-collection-cover')).to.be.true
    })

    it('should skip adding coverPath if it already exists', async () => {
      queryInterface.describeTable.resolves({ coverPath: { type: 'VARCHAR(255)' } })

      await up({ context: { queryInterface, logger } })

      expect(queryInterface.addColumn.called).to.be.false
      expect(logger.info.calledWith('[2.36.0 migration] coverPath column already exists in collections table')).to.be.true
    })

    it('should skip if collections table does not exist', async () => {
      queryInterface.tableExists.resolves(false)

      await up({ context: { queryInterface, logger } })

      expect(queryInterface.addColumn.called).to.be.false
      expect(logger.info.calledWith('[2.36.0 migration] collections table does not exist')).to.be.true
    })
  })

  describe('down', () => {
    it('should remove the coverPath column from the collections table', async () => {
      queryInterface.describeTable.resolves({ coverPath: { type: 'VARCHAR(255)' } })

      await down({ context: { queryInterface, logger } })

      expect(queryInterface.removeColumn.calledOnce).to.be.true
      expect(queryInterface.removeColumn.calledWith('collections', 'coverPath')).to.be.true

      expect(logger.info.calledWith('[2.36.0 migration] DOWNGRADE BEGIN: 2.36.0-add-collection-cover')).to.be.true
      expect(logger.info.calledWith('[2.36.0 migration] Removing coverPath column from collections table')).to.be.true
      expect(logger.info.calledWith('[2.36.0 migration] DOWNGRADE END: 2.36.0-add-collection-cover')).to.be.true
    })

    it('should skip removing coverPath if it does not exist', async () => {
      await down({ context: { queryInterface, logger } })

      expect(queryInterface.removeColumn.called).to.be.false
      expect(logger.info.calledWith('[2.36.0 migration] coverPath column does not exist in collections table')).to.be.true
    })

    it('should skip if collections table does not exist', async () => {
      queryInterface.tableExists.resolves(false)

      await down({ context: { queryInterface, logger } })

      expect(queryInterface.removeColumn.called).to.be.false
      expect(logger.info.calledWith('[2.36.0 migration] collections table does not exist')).to.be.true
    })
  })
})
