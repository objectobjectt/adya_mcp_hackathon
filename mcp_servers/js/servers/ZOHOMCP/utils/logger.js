// Logger configuration and utilities
export function configureLogger() {
    console.log = function () {
        process.stderr.write("[INFO] " + Array.from(arguments).join(" ") + "\n");
    };

    console.error = function () {
        process.stderr.write("[ERROR] " + Array.from(arguments).join(" ") + "\n");
    };
}

// Utility function to log 
export const logger = {
    info: (message, ...args) => {
        console.log( message, ...args);
    },
    
    success: (message, ...args) => {
        console.log(message, ...args);
    },
    
    error: (message, ...args) => {
        console.error(message, ...args);
    },
    
    warning: (message, ...args) => {
        console.log(message, ...args);
    },
    
    loading: (message, ...args) => {
        console.log(message, ...args);
    },
    
    network: (message, ...args) => {
        console.log(message, ...args);
    },
    
    clipboard: (message, ...args) => {
        console.log(message, ...args);
    },
    
    rocket: (message, ...args) => {
        console.log(message, ...args);
    }
};