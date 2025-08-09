import { Logger, PropertiesService, UrlFetchApp } from 'gasmask';
import Properties from 'gasmask/dist/Properties';
global.Logger = Logger;
global.PropertiesService = PropertiesService;
global.UrlFetchApp = UrlFetchApp;

// Define interfaces for testing
interface MockHTTPResponse {
    getResponseCode(): number;
    getContentText(): string;
}

interface MockOAuth2Service {
    hasAccess: jest.Mock<boolean>;
    getAccessToken: jest.Mock<string>;
    getAuthorizationUrl: jest.Mock<string>;
    reset: jest.Mock<void>;
    setAuthorizationBaseUrl: jest.Mock<MockOAuth2Service, [string]>;
    setTokenUrl: jest.Mock<MockOAuth2Service, [string]>;
    setClientId: jest.Mock<MockOAuth2Service, [string]>;
    setClientSecret: jest.Mock<MockOAuth2Service, [string]>;
    setScope: jest.Mock<MockOAuth2Service, [string]>;
    setCallbackFunction: jest.Mock<MockOAuth2Service, [string]>;
    setPropertyStore: jest.Mock<MockOAuth2Service, [any]>;
    handleCallback: jest.Mock<void, [unknown]>;
}

interface MockOAuth2Library {
    createService: jest.Mock<MockOAuth2Service, [string]>;
}

interface BasecampTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
}

interface OAuthLibraryData {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    expiresAt?: number;
}

describe("OAuth2 Refresh Functionality", () => {
    let mockUserProperties: Properties;
    let mockOAuth2Service: MockOAuth2Service;
    
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        
        // Mock OAuth2 service with proper typing - create a chainable mock
        const createChainableMock = () => mockOAuth2Service;
        
        mockOAuth2Service = {
            hasAccess: jest.fn<boolean, []>(),
            getAccessToken: jest.fn<string, []>().mockReturnValue('mock_access_token'),
            getAuthorizationUrl: jest.fn<string, []>().mockReturnValue('https://example.com/auth'),
            reset: jest.fn<void, []>(),
            setAuthorizationBaseUrl: jest.fn<MockOAuth2Service, [string]>().mockImplementation(createChainableMock),
            setTokenUrl: jest.fn<MockOAuth2Service, [string]>().mockImplementation(createChainableMock),
            setClientId: jest.fn<MockOAuth2Service, [string]>().mockImplementation(createChainableMock),
            setClientSecret: jest.fn<MockOAuth2Service, [string]>().mockImplementation(createChainableMock),
            setScope: jest.fn<MockOAuth2Service, [string]>().mockImplementation(createChainableMock),
            setCallbackFunction: jest.fn<MockOAuth2Service, [string]>().mockImplementation(createChainableMock),
            setPropertyStore: jest.fn<MockOAuth2Service, [any]>().mockImplementation(createChainableMock),
            handleCallback: jest.fn<void, [unknown]>()
        };

        // Mock Properties
        mockUserProperties = new Properties();
        jest.spyOn(PropertiesService, 'getUserProperties').mockReturnValue(mockUserProperties);
        
        // Mock OAuth2 library with proper typing
        const mockOAuth2Library: MockOAuth2Library = {
            createService: jest.fn<MockOAuth2Service, [string]>().mockReturnValue(mockOAuth2Service)
        };
        global.OAuth2 = mockOAuth2Library;
    });

    describe("simulateTokenExpiration", () => {
        beforeEach(() => {
            jest.resetModules();
        });

        it("should clear OAuth data and backup refresh token", () => {
            // Arrange
            const oauthData: OAuthLibraryData = {
                access_token: 'current_access_token',
                refresh_token: 'current_refresh_token',
                expires_in: 1209600
            };
            
            const getPropertySpy = jest.spyOn(mockUserProperties, 'getProperty')
                .mockReturnValue(JSON.stringify(oauthData));
            const setPropertySpy = jest.spyOn(mockUserProperties, 'setProperty');
            const deletePropertySpy = jest.spyOn(mockUserProperties, 'deleteProperty');

            // Import and test
            const { simulateTokenExpiration }: { simulateTokenExpiration: () => boolean } = require('../src/main/basecamp');
            const result: boolean = simulateTokenExpiration();
            
            // Assert
            expect(result).toBe(true);
            expect(setPropertySpy).toHaveBeenCalledWith(
                'Basecamp.refresh_token',
                'current_refresh_token'
            );
            expect(deletePropertySpy).toHaveBeenCalledWith('oauth2.Basecamp');
        });

        it("should return false when no OAuth data exists", () => {
            // Arrange
            const getPropertySpy = jest.spyOn(mockUserProperties, 'getProperty')
                .mockReturnValue(null);

            // Import and test
            const { simulateTokenExpiration }: { simulateTokenExpiration: () => boolean } = require('../src/main/basecamp');
            const result: boolean = simulateTokenExpiration();
            
            // Assert
            expect(result).toBe(false);
        });
    });

    describe("viewAuthStatus", () => {
        beforeEach(() => {
            jest.resetModules();
        });

        it("should log authentication status when user has access", () => {
            // Arrange
            mockOAuth2Service.hasAccess.mockReturnValue(true);
            const getPropertySpy = jest.spyOn(mockUserProperties, 'getProperty')
                .mockReturnValue('stored_refresh_token');
            const logSpy = jest.spyOn(Logger, 'log');

            // Import and test
            const { viewAuthStatus }: { viewAuthStatus: () => void } = require('../src/main/basecamp');
            viewAuthStatus();
            
            // Assert - check that status was logged (match actual output format)
            expect(logSpy).toHaveBeenCalledWith('✅ Currently Authenticated: YES');
            expect(logSpy).toHaveBeenCalledWith('🔄 Automatic Refresh Available: YES');
        });

        it("should log unauthenticated status when user has no access", () => {
            // Arrange
            mockOAuth2Service.hasAccess.mockReturnValue(false);
            const getPropertySpy = jest.spyOn(mockUserProperties, 'getProperty')
                .mockReturnValue(null);
            const logSpy = jest.spyOn(Logger, 'log');

            // Import and test
            const { viewAuthStatus }: { viewAuthStatus: () => void } = require('../src/main/basecamp');
            viewAuthStatus();
            
            // Assert - check that status was logged (match actual output format)
            expect(logSpy).toHaveBeenCalledWith('✅ Currently Authenticated: NO');
            expect(logSpy).toHaveBeenCalledWith('🔄 Automatic Refresh Available: NO');
        });
    });

    describe("OAuth callback integration", () => {
        beforeEach(() => {
            jest.resetModules();
        });

        it("should handle OAuth callback with valid request", () => {
            // Arrange
            const mockRequest = {
                parameter: {
                    code: 'auth_code_12345',
                    state: 'oauth_state'
                }
            };

            const mockHtmlOutput = {
                getContent: jest.fn().mockReturnValue('<html>Success</html>')
            };

            // Mock HtmlService
            global.HtmlService = {
                createHtmlOutput: jest.fn().mockReturnValue(mockHtmlOutput)
            };

            // Mock OAuth2 service callback handling
            mockOAuth2Service.handleCallback.mockImplementation(() => {
                // Simulate successful token storage
                mockUserProperties.setProperty('oauth2.Basecamp', JSON.stringify({
                    access_token: 'new_access_token',
                    refresh_token: 'new_refresh_token',
                    expires_in: 1209600
                }));
            });

            // Import and test
            const { oauthCallback }: { oauthCallback: (request: unknown) => any } = require('../src/main/basecamp');
            const result = oauthCallback(mockRequest);
            
            // Assert
            expect(mockOAuth2Service.handleCallback).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeTruthy();
        });

        it("should handle invalid OAuth callback request gracefully", () => {
            // Arrange
            const mockRequest = {
                parameter: {
                    error: 'access_denied'
                }
            };

            const mockHtmlOutput = {
                getContent: jest.fn().mockReturnValue('<html>Error</html>')
            };

            global.HtmlService = {
                createHtmlOutput: jest.fn().mockReturnValue(mockHtmlOutput)
            };

            // Import and test
            const { oauthCallback }: { oauthCallback: (request: unknown) => any } = require('../src/main/basecamp');
            const result = oauthCallback(mockRequest);
            
            // Assert
            expect(mockOAuth2Service.handleCallback).toHaveBeenCalledWith(mockRequest);
            expect(result).toBeTruthy();
        });
    });
});
