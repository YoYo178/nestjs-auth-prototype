import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Module({
    providers: [{
        provide: 'REDIS_CLIENT',
        inject: [ConfigService],
        useFactory: async (config: ConfigService) => {
            const logger = new Logger(RedisModule.name);
            const redisClient = createClient({
                url: config.get('REDIS_URL')
            });

            redisClient.on('error', err => logger.error('Error connecting to Redis server:', err));
            await redisClient.connect();
            logger.log('Connected to Redis server');
            return redisClient
        }
    }],
    exports: ['REDIS_CLIENT']
})
export class RedisModule {}
